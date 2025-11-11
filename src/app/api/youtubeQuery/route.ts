import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import type { CreateYoutubeJobRequest } from "@/app/types";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
export const runtime = "nodejs";

function getKValue(query: string): number {
  const lowerQuery = query.toLowerCase();

  // explanation, comparison, comprehensive, smummary/overview, how, why words are indicators of high complexity.
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
  const vectorStore = await PineconeStore.fromExistingIndex(embeddingsModel, {
    pineconeIndex: index,
    namespace: namespace,
  });

  const retriever = vectorStore.asRetriever({
    k: getKValue(query),
    filter: {
      scoreThreshold: 0.5,
    },
  });

  const relevantChunks = await retriever.invoke(query);
  console.log("relevantChunks", relevantChunks);
  if (relevantChunks.length === 0) {
    return NextResponse.json({ error: "No relevant chunks found" });
  }
  const sortedRelevantChunks = relevantChunks.sort(
    (a, b) => a.metadata.offset - b.metadata.offset
  );

  const context = sortedRelevantChunks
    .map((chunk) => {
      const text = chunk.pageContent
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const metadata = chunk.metadata;

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

  // Initialise the LLM
  const llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.1, // 0.0 = deterministic, 0.5 = balanced, 1.0 = creative
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  console.log("context", context);
  console.log("query", query);

  const userQueryPrompt = await llm.invoke(
    `You are a helpful assistant answering questions about a YouTube video transcript.
    Use the following context from the video transcript to answer the user's question. If the context doesn't contain enough information to answer the question or the question is not related to the context, say so.
    Do not hallucinate information.
    Context from video:
    
    ${context}.
    
    User Question: 
    ${query}
    Provide a clear, concise answer based on the context. If timestamps are available, you can reference them.`
  );

  console.log("userQueryPrompt", userQueryPrompt);

  return NextResponse.json({ relevantChunks });
}
