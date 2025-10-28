import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
// import { jobManager } from "@/lib/jobManager";
import type { CreateYoutubeJobRequest } from "@/app/types";
import ytdl from "ytdl-core";
import { fetchTranscript } from "youtube-transcript-plus";
import { decode } from "he";
import { SummaryDepth, Style } from "@/app/types";
export const runtime = "nodejs";

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

    const decodedTranscript = transcriptRes.map((segment) =>
      // if add timestamps is added append to the text at the end
      deepDecode(segment.text)
    );

    const fullText = decodedTranscript.map((s) => s.trim()).filter(Boolean);
    // console.log("full text", fullText);
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
