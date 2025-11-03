import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
// import { jobManager } from "@/lib/jobManager";
import type { CreateYoutubeJobRequest } from "@/app/types";
import ytdl from "ytdl-core";
import { fetchTranscript } from "youtube-transcript-plus";
import { decode } from "he";
import { SummaryDepth, Style } from "@/app/types";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
export const runtime = "nodejs";

// 1. Load documents (PDFs, text, URLs, etc.)

// 2. Split documents into chunks

// 3. Embed the chunks using an embedding model

// 4. Store embeddings in a vector database

// 5. Create a retriever from that database

// 6. Build a chain where:

// 7. user query → retriever → LLM → final answer

// (Optional) Add features like re-ranking, caching, tools, or agents

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateYoutubeJobRequest;
  const depth = body.depth;
  console.log("depth", depth);
  const style = body.style as Style;
  console.log("style", style);
  const includeTimestamps = body.includeTimestamps;
  console.log("includeTimestamps", includeTimestamps);
  const ytURL = body.url;

  function buildChunkExtractionPrompt(
    chunkText: string,
    includeTimestamps: boolean
  ) {
    return `
  Extract a summary of the transcript text. 
  - British English. Text and sub headings only.
  - Output notes only, no prose or other text.
  - Each sub heading should have a summary of the points relevant to the sub heading. include key points and facts, no duplicates.
  ${
    includeTimestamps &&
    `- Add timestamps to the end of each summarised point under each sub heading in the format [mm:ss]`
  }
  """
  ${chunkText}
  """
  `.trim();
  }

  function buildFinalPrompt(
    data: string,
    depth: SummaryDepth,
    style: Style,
    includeTimestamps: boolean,
    videoTitle?: string
  ) {
    const depthText = depth === "brief" ? "120–180 words" : "250–400 words";
    return `
  You are an expert note taker. Create a final summary from the below notes extracted from the transcript of a Youtube video titled "${videoTitle}". 
  
  - Use British English. 
  - No invented facts.
  - Ignore any notes that do not relevant to the overarching theme of the video i.e jokes, etc.
  - Target length: ${depthText}.
  - Style: ${style}.
  - ${
    includeTimestamps
      ? "If a point maps to a provided [mm:ss], keep it in parentheses. Do NOT invent times."
      : "Do not include timestamps."
  }
  - No meta text; output only the formatted summary.
  
  ${videoTitle && `Title: ${videoTitle}.`}
  
  Structured notes:
  ${data}
  `.trim();
  }

  try {
    if (!ytURL) {
      return NextResponse.json({ error: "Missing url" }, { status: 422 }); // unprocessable content
    }

    const isValid = ytdl.validateURL(ytURL);
    if (!isValid) {
      console.log("not valid");
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // get meta data of video if video is too long need to reject and send back an error
    const videoInfo = await ytdl.getBasicInfo(ytURL);
    const videDetails = videoInfo.videoDetails;
    const videoTitle = videDetails.title;

    const transcriptRes = await fetchTranscript(ytURL);
    if (!Array.isArray(transcriptRes) || transcriptRes.length === 0)
      return NextResponse.json(
        { error: "Transcript not found" },
        { status: 404 }
      ); // resource not found

    console.log("transcriptRes", transcriptRes);
    // decode via double decoding function
    const deepDecode = (s: string) => {
      let prev = s ?? "";
      for (let i = 0; i < 2; i++) {
        // 2–3 passes are usually enough
        const next = decode(prev);
        if (next === prev) break;
        prev = next;
      }
      return prev;
    };

    // normalise the transcript
    const decodedTranscript = transcriptRes.map((segment) => ({
      text: deepDecode(segment.text),
      offset: segment.offset,
      duration: segment.duration,
    }));

    // create a full text transcript string
    // const fullText = decodedTranscript
    //   .map((s) => s.text.trim())
    //   .filter(Boolean)
    //   .join(" ");

    // Build joined text and track character positions

    const segmentRanges: Array<{
      startChar: number;
      endChar: number;
      offset: number;
      endTime: number;
    }> = [];

    let currentChar = 0;

    const fullText = decodedTranscript
      .map((segment) => {
        const startChar = currentChar;
        const endChar = currentChar + segment.text.length;

        segmentRanges.push({
          startChar,
          endChar,
          offset: segment.offset,
          endTime: segment.offset + segment.duration,
        });

        currentChar = endChar + 1; // +1 for space between segments
        return segment.text.trim();
      })
      .filter(Boolean)
      .join(" ");

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000, // The maximum size of a chunk, where size is determined by the length_function
      chunkOverlap: 120, // Target overlap between chunks. Overlapping chunks helps to mitigate loss of information when context is divided between chunks.
      // length_function: "words", // The function to use to determine the length of a chunk.
      // is_separator_regex: Whether the separator list (defaulting to ["\n\n", "\n", " ", ""]) should be interpreted as regex.
    });

    // creating langchain document objects
    const chunks = await splitter.createDocuments([fullText]);
    // Add custom metadata and IDs to each chunk
    const chunksWithMetadata = chunks.map((chunk, index) => {
      // Find timestamp range for this chunk (using the mapping logic from earlier)

      // find the start and end indexes of the chunk in the full text
      const chunkStart = fullText.indexOf(chunk.pageContent);
      const chunkEnd = chunkStart + chunk.pageContent.length;

      // find the overlapping segments in the segment ranges
      const overlappingSegments = segmentRanges.filter(
        (range) => chunkStart < range.endChar && chunkEnd > range.startChar
      );

      // find the minimum offset and maximum end time of the overlapping segments
      const minOffset =
        overlappingSegments.length > 0
          ? Math.min(...overlappingSegments.map((s) => s.offset))
          : 0;
      const maxEndTime =
        overlappingSegments.length > 0
          ? Math.max(...overlappingSegments.map((s) => s.endTime))
          : 0;

      return {
        ...chunk, // Keep original pageContent and metadata.loc
        metadata: {
          ...chunk.metadata, // Keep existing loc info
          chunkIndex: index,
          offset: minOffset,
          duration: maxEndTime - minOffset,
          videoId: videoInfo.videoDetails.videoId,
          videoTitle: videoTitle,
        },
        id: `${videoInfo.videoDetails.videoId}-chunk-${index}`, // Add unique ID for Pinecone
      };
    });
    console.log("chunksWithMetadata", chunksWithMetadata);

    // embed the chunks with metadata

    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY as string,
    });

    const index = pc.Index(process.env.PINECONE_INDEX_NAME as string);

    // Initialize OpenAI embeddings model
    const embeddings = new OpenAIEmbeddings({
      modelName: "text-embedding-3-small",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Embed all chunks
    const chunkTexts = chunksWithMetadata.map((chunk) => chunk.pageContent);
    const chunkEmbeddings = await embeddings.embedDocuments(chunkTexts);
    console.log("chunkEmbeddings", chunkEmbeddings);

    // Prepare data for Pinecone upsert
    const vectorsToUpsert = chunksWithMetadata.map((chunk, index) => ({
      id: chunk.id,
      values: chunkEmbeddings[index],
      metadata: {
        text: chunk.pageContent,
        chunkIndex: chunk.metadata.chunkIndex,
        offset: chunk.metadata.offset,
        duration: chunk.metadata.duration,
        videoId: chunk.metadata.videoId,
        videoTitle: chunk.metadata.videoTitle,
      },
    }));

    console.log("vectorsToUpsert", vectorsToUpsert);

    // Upsert vectors into Pinecone with namespace per video
    const namespace = `youtube-${videoInfo.videoDetails.videoId}`;
    console.log(
      `Upserting ${vectorsToUpsert.length} vectors into namespace: ${namespace}`
    );

    // Pinecone upsert can handle batches, but for large batches, chunk them
    const batchSize = 100;
    for (let i = 0; i < vectorsToUpsert.length; i += batchSize) {
      const batch = vectorsToUpsert.slice(i, i + batchSize);
      await index.namespace(namespace).upsert(batch);
    }

    console.log(
      `Successfully stored ${vectorsToUpsert.length} chunks in Pinecone`
    );

    throw new Error("testing");

    const characterLimit = 3800;

    // loop over the full text
    let counter = 0;
    let singleChunk: string[] = [];
    const transcriptChunks: string[][] = [];
    fullText.forEach((text: string) => {
      // create new chunk(array of text)
      if (counter >= characterLimit) {
        transcriptChunks.push(singleChunk);
        singleChunk = [];
        counter = 0;
      }
      singleChunk.push(text);
      counter += text.length;
    });

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // create summary for each trasncript chunk
    const summaryResponses = await Promise.all(
      transcriptChunks.map(async (chunk, index) => {
        console.log("chunk", chunk);
        const prompt = buildChunkExtractionPrompt(
          chunk.join(" "),
          includeTimestamps
        );
        console.log("prompt", prompt);

        const response = await client.responses.create({
          model: "gpt-5-nano",
          input: prompt,
        });
        return response;
      })
    );

    const summaryChunks = summaryResponses.map(
      (response) => response.output_text
    );
    console.log("summaryChunks", summaryChunks);

    const normalisedSummaryChunks = summaryChunks.map(
      (chunk) =>
        chunk
          .replace(/[ \t]+/g, " ")
          .replace(/\n{3,}/g, "\n\n")
          .trim() // remove excess white space by replacing any sequence of spaces or tabs with a single space and three or more consecutive newlines with just two newlines
    );
    console.log("normalisedSummaryChunks", normalisedSummaryChunks);
    const joinedSummaryChunks = normalisedSummaryChunks.join("\n\n");

    // build final prompt with all the summary chunks joined together
    const finalPrompt = buildFinalPrompt(
      joinedSummaryChunks,
      depth,
      style,
      includeTimestamps,
      videoTitle
    );
    console.log("finalPrompt", finalPrompt);
    const finalPromptResponse = await client.responses.create({
      model: "gpt-5-nano",
      input: finalPrompt,
    });
    console.log("finalPromptResponse", finalPromptResponse);
    throw new Error("testing");

    return NextResponse.json({ summary: "this is a summary" }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 }
    );
  }
}
