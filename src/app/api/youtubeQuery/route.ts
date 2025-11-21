import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import type { Matches } from "@/app/types";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
export const runtime = "nodejs";

function getKValue(query: string): number {
  const lowerQuery = query.toLowerCase();

  // explanation, comparison, comprehensive, summary/overview, how, why words are indicators of high complexity.
  const highComplexityKeywords = [
    "explain",
    "analyze",
    "break down",
    "describe",
    "elaborate",
    "compare",
    "contrast",
    "difference",
    "similarities",
    "relationship",
    "all",
    "everything",
    "list",
    "multiple",
    "various",
    "every",
    "how",
    "why",
    "what causes",
    "process",
    "steps",
    "method",
    "summarize",
    "summarise",
    "overview",
    "summary",
    "recap",
    "main points",
    "complete",
    "full",
    "entire",
    "comprehensive",
    "thorough",
  ];

  // Medium complexity indicators
  const mediumComplexityKeywords = [
    "what",
    "tell me",
    "give me",
    "show me",
    "examples",
    "instances",
    "cases",
  ];

  // Check for high complexity
  const isHighComplexity = highComplexityKeywords.some((keyword) =>
    lowerQuery.includes(keyword)
  );

  // Check for medium complexity
  const isMediumComplexity = mediumComplexityKeywords.some((keyword) =>
    lowerQuery.includes(keyword)
  );

  let kValue: number = 0;
  // Determine k value
  if (isHighComplexity) {
    kValue = 10; // More chunks for complex queries
  } else if (isMediumComplexity) {
    kValue = 7; // Medium chunks
  } else {
    kValue = 5; // Default for simple queries
  }

  // override the k value if the query is too long. need to be improved.
  const queryLength = query.split(" ").length;
  if (queryLength > 20) kValue = 10;
  return kValue;
}

// Helper functions for context depth analysis
function extractKeywords(query: string): string[] {
  // Common English stop words to filter out
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "he",
    "in",
    "is",
    "it",
    "its",
    "of",
    "on",
    "that",
    "the",
    "to",
    "was",
    "were",
    "will",
    "with",
    "about",
    "can",
    "could",
    "do",
    "does",
    "did",
    "have",
    "had",
    "how",
    "i",
    "if",
    "into",
    "may",
    "might",
    "should",
    "this",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
    "would",
    "you",
    "your",
    "me",
    "my",
    "or",
    "but",
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/) // Split on whitespace
    .filter(
      (word) =>
        word.length > 2 && // Keep words longer than 2 chars
        !stopWords.has(word) // Remove stop words
    );
}

// function to calculate the keyword coverage of the query in the context
function calculateKeywordCoverage(query: string, context: string): number {
  // Extract meaningful keywords from query
  const keywords = extractKeywords(query);

  // Handle edge case: no keywords extracted
  if (keywords.length === 0) {
    return 0.5; // Neutral score for empty/stop-word-only queries
  }

  // Normalize context for matching
  const contextLower = context.toLowerCase();

  // Count how many query keywords appear in context
  const matchedKeywords = keywords.filter((keyword) =>
    contextLower.includes(keyword.toLowerCase())
  );

  // Calculate coverage ratio
  const coverageScore = matchedKeywords.length / keywords.length;

  return coverageScore;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { query: string; videoId: string };
  const query = body.query;
  const videoId = body.videoId;
  console.log("query", query);

  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
  });
  const index = pc.Index(process.env.PINECONE_INDEX_NAME as string);
  const embeddingsModel = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
  const namespace = `youtube-${videoId}`;

  // k value is determined by the query length and the complexity of the query.
  // k value is used to retrieve the top k chunks from the vector store.
  const kValue = getKValue(query);

  const queryEmbedding = await embeddingsModel.embedQuery(query);

  // Query Pinecone directly to get scores
  const queryResponse = await index.namespace(namespace).query({
    vector: queryEmbedding,
    topK: kValue,
    includeMetadata: true, // This includes your chunk metadata
  });

  console.log("queryResponse with scores:", queryResponse);

  // LangChain retriever implementation
  //   // initialise the vector store
  //   const vectorStore = await PineconeStore.fromExistingIndex(embeddingsModel, {
  //     pineconeIndex: index,
  //     namespace: namespace,
  //   });

  //   const retriever = vectorStore.asRetriever({
  //     k: kValue,
  //     // filter: {
  //     //   scoreThreshold: 0.5, // 0.1 - 1 - The higher the stricter.
  //     // },
  //   });

  //   const relevantChunks = await retriever.invoke(query);

  // Extract scores from matches
  const matches = queryResponse.matches as unknown as Matches[];
  console.log("matches", matches);

  if (matches.length === 0) {
    return NextResponse.json({ error: "No relevant chunks found" });
  }

  // Get max score
  const maxScore = Math.max(...matches.map((m) => m.score));
  console.log("Max score:", maxScore);

  // Determine score threshold based on max score (from your plan)
  let scoreThreshold: number;
  if (maxScore > 0.7) {
    scoreThreshold = 0.6; // Strict filter
  } else if (maxScore >= 0.5) {
    scoreThreshold = 0.4; // Moderate filter
  } else {
    scoreThreshold = 0.3; // Lenient filter
  }
  console.log("Using score threshold:", scoreThreshold);

  // Filter matches to get relevant chunks based on the score threshold.
  const relevantChunks = matches.filter(
    (m) => m.score && m.score >= scoreThreshold
  );

  console.log("relevantChunks", relevantChunks);

  if (relevantChunks.length === 0) {
    return NextResponse.json({
      answer: `I couldn't find any relevant information in this video related to "${query}". This topic doesn't appear to be covered in the video transcript.`,
      metadata: {
        contextQuality: "insufficient",
        reason: "no_chunks_found",
        chunkCount: 0,
        totalWords: 0,
        maxScore: maxScore,
        suggestion:
          "Try asking about a different topic that's covered in the video, or rephrase your question using different keywords.",
      },
    });
  }
  const sortedRelevantChunks = relevantChunks.sort(
    (a, b) => a.metadata.offset - b.metadata.offset
  );

  const context = sortedRelevantChunks
    .map((chunk) => {
      const metadata = chunk.metadata;
      const text = metadata.text
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      // calculate minuets and seconds
      if (metadata?.offset) {
        const minutes = Math.floor(metadata.offset / 60);
        const seconds = Math.floor(metadata.offset % 60);
        const timestamp = `[${String(minutes).padStart(2, "0")}:${String(
          seconds
        ).padStart(2, "0")}]`;
        return `${text} ${timestamp}`;
      } else {
        return text;
      }
    })
    .join("\n\n");

  // CONTEXT DEPTH ANALYSIS.

  // quantitive measures of the context depth
  const chunkCount = sortedRelevantChunks.length;
  const totalWords = sortedRelevantChunks.reduce(
    (acc, chunk) => acc + chunk.metadata.text.split(" ").length,
    0
  );
  const averageScore =
    matches.reduce((acc, match) => acc + match.score, 0) / matches.length;
  const keywordCoverageScore = calculateKeywordCoverage(query, context);

  // Add this function for the LLM sufficiency check for qualitative analysis
  async function evaluateContextSufficiency(
    context: string,
    query: string,
    chunkCount: number,
    totalWords: number,
    keywordCoverage: number
  ): Promise<{
    sufficient: boolean;
    coverage: number;
    depth: "shallow" | "moderate" | "comprehensive";
    reasoning: string;
  }> {
    const prompt = `You are evaluating if retrieved video transcript context is sufficient to answer a user's question.
  
  QUANTITATIVE METRICS:
  - Chunks retrieved: ${chunkCount}
  - Total words: ${totalWords}
  - Keyword coverage: ${(keywordCoverage * 100).toFixed(0)}%
  
  RETRIEVED CONTEXT:
  ${context}
  
  USER QUESTION:
  ${query}
  
  Evaluate these 3 aspects:
  1. Does the context cover all aspects of the question?
  2. Is there enough depth/detail to provide a meaningful answer?
  3. What percentage of the question can be answered with this context?
  
  Respond ONLY with valid JSON (no markdown):
  {
    "sufficient": true or false,
    "coverage": 0-100,
    "depth": "shallow" or "moderate" or "comprehensive",
    "reasoning": "brief explanation"
  }`;

    try {
      const llm = new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0.1,
        openAIApiKey: process.env.OPENAI_API_KEY,
      });

      const response = await llm.invoke(prompt);

      // Extract JSON from response
      const jsonMatch = String(response.content).match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("No JSON found in response");
    } catch (error) {
      console.error("Failed to parse LLM sufficiency response:", error);
      // Fallback
      return {
        sufficient: false,
        coverage: 50,
        depth: "moderate",
        reasoning: "Unable to parse evaluation",
      };
    }
  }

  // Initialise the LLM
  const llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.4, // 0.0 = deterministic, 0.5 = balanced, 1.0 = creative
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const sufficientContextQuery = `You are a helpful assistant answering questions about a YouTube video transcript.

Use ONLY the following context from the video transcript to answer the user's question. Do not use external knowledge or hallucinate information.

Context from video:
${context}

User Question: 
${query}

Provide a clear, detailed answer based strictly on the context above. Reference timestamps when relevant.`;

  const insufficientContextQuery = `You are a helpful assistant answering questions about a YouTube video transcript.

Answer the user's question using the video context below as your primary source of information. You can use external knowledge if the information from the video context is not sufficient to answer the question. 
Clearly indicate in your response information that is from the video context and information that is from external knowledge.

Context from video:
${context}

User Question: 
${query}

Provide a clear, detailed answer based on the context above. Reference timestamps when relevant.
  `;
  // INSUFFICIENT: poor quantitative metrics
  if (
    chunkCount < 2 ||
    totalWords < 100 ||
    averageScore < 0.35 ||
    keywordCoverageScore < 0.25
  ) {
    // early return. Return to use message to the user.
    let reason = "";
    if (chunkCount < 2) {
      reason = "only found very few relevant sections";
    } else if (totalWords < 100) {
      reason = "found limited detail on this topic";
    } else if (averageScore < 0.35) {
      reason = "the retrieved content has low relevance";
    } else if (keywordCoverageScore < 0.25) {
      reason = "the video content doesn't match your question well";
    }

    return NextResponse.json({
      answer: `I couldn't find sufficient information in this video to properly answer your question about "${query}". The video ${
        chunkCount === 0
          ? "doesn't appear to cover this topic"
          : `only briefly mentions this topic (${chunkCount} relevant section${
              chunkCount === 1 ? "" : "s"
            }, ~${totalWords} words)`
      }.`,
      metadata: {
        contextQuality: "insufficient",
        reason: reason,
        metrics: {
          chunkCount,
          totalWords,
          averageScore: parseFloat(averageScore.toFixed(2)),
          keywordCoverage: parseFloat(keywordCoverageScore.toFixed(2)),
          maxScore: parseFloat(maxScore.toFixed(2)),
        },
        suggestion:
          chunkCount > 0
            ? "The video touches on this briefly. Try asking a more specific question about what was mentioned, or explore a different aspect of the video."
            : "Try rephrasing your question or asking about a topic that's more central to the video's content.",
      },
    });
  }
  // SUFFICIENT: Clear indicators of good context
  else if (
    chunkCount >= 5 &&
    totalWords >= 300 &&
    averageScore >= 0.65 &&
    keywordCoverageScore >= 0.7
  ) {
    // run the LLM with the RAG only context.
    const response = await llm.invoke(sufficientContextQuery);
    console.log("response", response.content);
    return NextResponse.json({ answer: response.content });
  }

  // AMBIGUOUS: Everything in between - needs LLM evaluation
  else {
    // run the LLM with the RAG context and general knowledge.
    const llmCheck = await evaluateContextSufficiency(
      context,
      query,
      chunkCount,
      totalWords,
      keywordCoverageScore
    );
    if (llmCheck.sufficient) {
      // run the LLM with the RAG only context.
      const response = await llm.invoke(sufficientContextQuery);
      console.log("response", response.content);
      return NextResponse.json({ answer: response.content });
    } else {
      // run the LLM with the RAG context and general knowledge.
      const response = await llm.invoke(insufficientContextQuery);
      console.log("response", response.content);
      return NextResponse.json({ answer: response.content });
    }
  }
}
