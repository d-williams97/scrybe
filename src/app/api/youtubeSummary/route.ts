import { NextRequest, NextResponse } from "next/server";
// import { OpenAI } from "openai";
import { decode } from "he";
import { SummaryDepth, Style, CreateYoutubeJobRequest } from "@/app/types";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
export const runtime = "nodejs";
import { Supadata, Transcript, TranscriptChunk } from "@supadata/js";

// Helper function to extract YouTube video ID from various URL formats
function extractYouTubeVideoId(url: string): string | null {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

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

    // Style-specific instructions
    const styleInstructions = {
      "bullet-points":
        "Use bullet points (-) for individual points and facts, but ALWAYS use proper markdown headings (### for subheadings) to organize sections. Never use bullet points for section titles.",
      academic:
        "Use formal academic language with proper paragraph structure and citations where relevant.",
      casual:
        "Use conversational, easy-to-understand language while maintaining clarity.",
      "revision-notes":
        "Format as concise revision notes with key concepts highlighted.",
      paragraph:
        "Write in flowing paragraph format with clear topic sentences.",
    };

    return `
You are an expert note taker. Create a final summary from the below notes extracted from the transcript of a Youtube video titled "${videoTitle}". 

**Output your response in well-formatted Markdown.**

CRITICAL FORMATTING RULES:
- ALWAYS use ## for the main title
- ALWAYS use ### for section subheadings (e.g., "Key Points", "Overview", "Historical Context", etc.)
- Never use bullet points (-) for headings or subheadings
- Only use bullet points (-) for actual content items under subheadings

Additional guidelines:
- Use British English. 
- No invented facts.
- Ignore any notes that are not relevant to the overarching theme of the video (e.g., jokes, off-topic remarks).
- Target length: ${depthText}.
- Style: ${style}. ${styleInstructions[style] || ""}
- ${
      includeTimestamps
        ? "If a point maps to a provided timestamp, include it exactly as (mm:ss). Do NOT use square brackets. Do NOT invent times."
        : "Do not include timestamps."
    }
- No meta text; output only the formatted summary.
- Use **bold** for key terms and concepts.

${videoTitle && `Title: ${videoTitle}.`}

Structured notes:
${text}
`.trim();
  }

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

  try {
    if (!ytURL) {
      return NextResponse.json({ error: "Missing url" }, { status: 422 }); // unprocessable content
    }

    const extractedVideoId = extractYouTubeVideoId(ytURL);
    if (!extractedVideoId) {
      console.log("Invalid YouTube URL - could not extract video ID");
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }
    const videoId: string = extractedVideoId;

    const supadata = new Supadata({
      apiKey: process.env.SUPADATA_API_KEY as string,
    });

    const transcriptResult = await supadata.transcript({
      url: ytURL,
    });

    const transcriptContent = (transcriptResult as Transcript)
      ?.content as TranscriptChunk[];

    if (
      !transcriptContent ||
      !Array.isArray(transcriptContent) ||
      transcriptContent?.length === 0
    ) {
      console.log("Transcript not found");
      return NextResponse.json(
        { error: "Transcript not found" },
        { status: 404 }
      );
    }

    const metadata = await supadata.metadata({
      url: ytURL,
    });
    const videoTitle = metadata?.title ?? "YouTube Video Summary";

    // Normalise the transcript
    const decodedTranscript = transcriptContent.map((segment) => ({
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
        const cleanText = segment.text.trim().replace(/\s+/g, " ");

        const startChar = currentChar;
        const endChar = currentChar + cleanText.length;

        segmentRanges.push({
          startChar,
          endChar,
          offset: segment.offset, // when the segment starts in the video
          endTime: segment.offset + segment.duration,
        });

        currentChar = endChar + 1; // +1 for space between segments

        return cleanText;
      })
      .filter(Boolean)
      .join(" ");

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000, // The maximum size of a chunk, where size is determined by the length_function
      chunkOverlap: 200, // Target overlap between chunks. Overlapping chunks helps to mitigate loss of information when context is divided between chunks.
      // length_function: "words", // The function to use to determine the length of a chunk.
      // is_separator_regex: Whether the separator list (defaulting to ["\n\n", "\n", " ", ""]) should be interpreted as regex.
    });

    // creating langchain document objects
    const chunks = await splitter.createDocuments([fullText]);
    // add metadata to the chunks

    const chunksWithMetadata = chunks.map((chunk, index) => {
      // Find timestamp range for this chunk (using the mapping logic from earlier)

      // find the start and end indexes of the chunk in the full text
      const chunkStart = fullText.indexOf(chunk.pageContent);
      const chunkEnd = chunkStart + chunk.pageContent.length;

      // find the overlapping segments in the segment ranges
      const overlappingSegments = segmentRanges.filter(
        (range) => chunkEnd > range.startChar && chunkStart < range.endChar
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
          // Keep existing loc info
          chunkIndex: index,
          offset: minOffset,
          duration: maxEndTime - minOffset,
          videoId: videoId,
          videoTitle: videoTitle,
        },
        id: `${videoId}-chunk-${index}`, // Add unique ID for Pinecone
      };
    });

    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY as string,
    });

    const index = pc.Index(process.env.PINECONE_INDEX_NAME as string);

    // Initialise OpenAI embeddings model
    const embeddingsModel = new OpenAIEmbeddings({
      modelName: "text-embedding-3-small",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Embed all chunks with metadata
    const chunkTexts = chunksWithMetadata.map((chunk) => chunk.pageContent);
    const chunkEmbeddings = await embeddingsModel.embedDocuments(chunkTexts);

    // Prepare data for Pinecone upsert
    const vectorsToUpsert = chunksWithMetadata.map((chunk, index) => {
      if (index < 8) {
      }
      return {
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
      };
    });

    // Upsert vectors into Pinecone with namespace per video
    const namespace = `youtube-${videoId}`;

    // Pinecone upsert can handle batches, but for large batches, chunk them
    const batchSize = 100; // max batch size for Pinecone upsert is 1000 and must be < 2 mb
    for (let i = 0; i < vectorsToUpsert.length; i += batchSize) {
      const batch = vectorsToUpsert.slice(i, i + batchSize);
      await index.namespace(namespace).upsert(batch);
    }

    console.log(
      `Successfully stored ${vectorsToUpsert.length} chunks in Pinecone namespace ${namespace} for video ${videoId}`
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
    // console.log("sortedRelevantChunks", sortedRelevantChunks);

    const formattedRelevantChunks = sortedRelevantChunks
      .map((chunk) => {
        const text = chunk.pageContent
          .replace(/\n/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        const metadata = chunk.metadata;

        if (
          includeTimestamps &&
          metadata.offset !== undefined &&
          metadata.offset !== null
        ) {
          const totalSeconds = Math.floor(metadata.offset / 1000);
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = Math.floor(totalSeconds % 60);
          const timestamp = `(${String(minutes).padStart(2, "0")}:${String(
            seconds
          ).padStart(2, "0")})`;
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

    const stream = await llm.stream(summaryPrompt); // get llm stream
    const encoder = new TextEncoder(); // Converts JavaScript strings into Uint8Array bytes for the stream.
    const readable = new ReadableStream({
      // ReadableStream: a Web Streams API object that produces chunks over time.
      async start(controller) {
        // controller manages the stream
        try {
          for await (const chunk of stream) {
            const content = chunk.content;
            if (content) {
              controller.enqueue(encoder.encode(content as string)); // sends a chunk to the client immediately.
            }
          }
          controller.enqueue(encoder.encode(`\n__VIDEO_ID__:${videoId}`));
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
