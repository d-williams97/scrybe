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
  const style = body.style;
  console.log("style", style);
  const includeTimestamps = body.includeTimestamps;
  console.log("includeTimestamps", includeTimestamps);
  const ytURL = body.url;

  function buildSummaryPrompt(opts: {
    chunkText: string;
    depth: SummaryDepth;
    style: Style;
    includeTimestamps: boolean;
    videoTitle?: string;
    chunkIndex?: number;
    totalChunks?: number;
  }) {
    const {
      chunkText,
      depth,
      style,
      includeTimestamps,
      videoTitle,
      chunkIndex,
      totalChunks,
    } = opts;

    const depthTargets: Record<SummaryDepth, string> = {
      brief: "120–180 words",
      "in-depth": "250–350 words",
    };

    const styleDirectives: Record<Style, string> = {
      academic:
        "- Tone: clear, neutral, third-person.\n- Use short headings and concise sentences.\n- No emojis or slang.",
      casual:
        "- Tone: friendly, conversational, second-person.\n- Short sentences, no jargon.\n- No emojis.",
      "bullet-points":
        "- Output ONLY bullets (no intro/outro).\n- 6–10 bullets.\n- Each bullet max 2 lines.",
      "revision-notes":
        "- Use headings and bullets like exam notes.\n- Define key terms briefly.\n- End with 3 quick Q→A flashcards.",
      paragraph: "- Output 1–3 tight paragraphs.\n- No lists.\n- Avoid filler.",
    };

    const tsInstruction = includeTimestamps
      ? "- If [mm:ss] markers appear in text, keep them in parentheses next to the points they support. Do NOT invent timestamps."
      : "- Ignore timestamps; do not add any.";

    const chunkContext =
      chunkIndex && totalChunks
        ? `This is part ${chunkIndex} of ${totalChunks}. Do not refer to 'this chunk' or other parts; write a self-contained summary.`
        : "Write a self-contained summary.";

    return `
  You are an expert note-taker summarising a YouTube transcript for a general UK audience. Use British English. Base everything ONLY on the provided text. Do NOT invent facts.
  
  ${chunkContext}
  
  - Target length: ${depthTargets[depth]}.
  - Style: ${style}.
  ${styleDirectives[style]}
  ${tsInstruction}
  
  If the text ends mid-thought, summarise what is present without guessing missing content.
  
  Output requirements:
  - No preamble or meta-commentary.
  - No references to 'transcript', 'chunk', or 'video'.
  - Use clear formatting according to the chosen style.
  
  Context (optional): ${videoTitle ?? "Untitled"}
  
  Transcript text begins:
  """
  ${chunkText}
  """
  Transcript text ends.
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
    console.log("videoDetails", videDetails);
    const videoTitle = videDetails.title;

    const transcriptRes = await fetchTranscript(ytURL);
    if (!Array.isArray(transcriptRes) || transcriptRes.length === 0)
      return NextResponse.json(
        { error: "Transcript not found" },
        { status: 404 }
      ); // resource not found

    // console.log("transcriptRes", transcriptRes);
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
    console.log("full text", fullText);
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

    // Create the prompt for OpenAI API
    const wordLimitPerChunck = characterLimit / transcriptChunks.length;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log("transcriptChunks", transcriptChunks);
    await Promise.all(
      transcriptChunks.map(async (chunk, index) => {
        console.log("chunk", chunk);
        throw new Error("testing");
        const prompt = "yes";
        const response = await client.responses.create({
          model: "gpt-5-nano",
          input: prompt,
        });
        return response;
      })
    ).then((values) => {
      console.log("values", values);
    });
    // Add other inputs to my response prompt

    // Then neeed to summarise the summaries

    return NextResponse.json({ summary: "this is a summary" }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 }
    );
  }
}
