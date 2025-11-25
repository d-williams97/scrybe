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
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateYoutubeJobRequest;
  const depth = body.depth;
  const style = body.style as Style;
  const includeTimestamps = body.includeTimestamps;
  const ytURL = body.url;

  function buildSummaryPrompt(
    text: string,
    depth: SummaryDepth,
    style: Style,
    includeTimestamps: boolean,
    videoTitle: string
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
  ${text}
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

    // Normalise the transcript
    const decodedTranscript = transcriptRes.map((segment) => ({
      text: deepDecode(segment.text),
      offset: segment.offset,
      duration: segment.duration,
    }));

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
    const embeddingsModel = new OpenAIEmbeddings({
      modelName: "text-embedding-3-small",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Embed all chunks
    const chunkTexts = chunksWithMetadata.map((chunk) => chunk.pageContent);
    const chunkEmbeddings = await embeddingsModel.embedDocuments(chunkTexts);
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

    // Upsert vectors into Pinecone with namespace per video
    const namespace = `youtube-${videoInfo.videoDetails.videoId}`;

    // Pinecone upsert can handle batches, but for large batches, chunk them
    console.log("vectorsToUpsert length", vectorsToUpsert.length);
    const batchSize = 100; // max batch size for Pinecone upsert is 1000 and must be < 2 mb
    for (let i = 0; i < vectorsToUpsert.length; i += batchSize) {
      const batch = vectorsToUpsert.slice(i, i + batchSize);
      console.log("batch", batch);
      await index.namespace(namespace).upsert(batch);
    }

    console.log(
      `Successfully stored ${vectorsToUpsert.length} chunks in Pinecone namespace ${namespace} for video ${videoInfo.videoDetails.videoId}`
    );

    const vectorStore = await PineconeStore.fromExistingIndex(embeddingsModel, {
      pineconeIndex: index,
      namespace: namespace, // namespace is used to isolate the data for a specific video. Could filter below if not using name spaces
    });

    // scale the k based on the length of the video.
    const totalChunks = chunksWithMetadata.length;
    const kPercentage = depth === "brief" ? 0.08 : 0.15; // 8% or 15%
    const calculatedK = Math.ceil(totalChunks * kPercentage);
    console.log("calculateK", calculatedK);

    // Apply sensible max and min k bounds
    const minK = depth === "brief" ? 6 : 10;
    const maxK = depth === "brief" ? 20 : 35;
    const finalK = Math.max(minK, Math.min(calculatedK, maxK));
    console.log("finalK", finalK);

    const retriever = vectorStore.asRetriever({
      k: finalK, // Controls quantity, number of chunks to retrieve. This may need to be adjusted based on the length of the video
      // filter: { // The filter parameter filters results by metadata fields stored in Pinecone. Actually already redudant here since we are using the namespace
      //   videoId: {
      //     $eq: videoInfo.videoDetails.videoId, // $eq = equals operato
      //   },
      // },
    });

    const retrievalQuery = `Extract the main points, key takeaways, and essential information from this YouTube video titled "${videoTitle}". Focus on the most important topics and concepts discussed.`;
    const relevantChunks = await retriever.invoke(retrievalQuery);
    const sortedRelevantChunks = relevantChunks.sort(
      (a, b) => a.metadata.offset - b.metadata.offset
    );

    const formattedRelevantChunks = sortedRelevantChunks
      .map((chunk) => {
        const text = chunk.pageContent
          .replace(/\n/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        const metadata = chunk.metadata;

        // calculate minuets and seconds
        if (
          includeTimestamps &&
          metadata.offset !== undefined &&
          metadata.offset !== null
        ) {
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

    const summaryPrompt = buildSummaryPrompt(
      formattedRelevantChunks,
      depth,
      style,
      includeTimestamps,
      videoTitle
    );

    // Initialise the LLM
    const llm = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.1, // 0.0 = deterministic, 0.5 = balanced, 1.0 = creative
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const stream = await llm.stream(summaryPrompt); // gte llm stream
    const encoder = new TextEncoder(); // Converts JavaScript strings into Uint8Array bytes for the stream.
    const readable = new ReadableStream({
      // ReadableStream: a Web Streams API object that produces chunks over time.
      async start(controller) {
        // controller manages the stream
        try {
          for await (const chunk of stream) {
            console.log("chunk", chunk);
            const content = chunk.content;
            console.log("content", content);
            if (content) {
              controller.enqueue(encoder.encode(content as string)); // sends a chunk to the client immediately.
            }
          }
          controller.enqueue(
            encoder.encode(`\n__VIDEO_ID__:${videoInfo.videoDetails.videoId}`)
          );
          controller.close(); // signals the stream is complete.
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Returns a streaming Response with chunked transfer encoding. This is a HTTP response that allows the client to receive the stream in chunks.
    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 }
    );
  }
}
