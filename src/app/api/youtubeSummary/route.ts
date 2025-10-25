import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
// import { jobManager } from "@/lib/jobManager";
import type { CreateYoutubeJobRequest } from "@/app/types";
import ytdl from "ytdl-core";
import { fetchTranscript } from "youtube-transcript-plus";
import { decode } from "he";

export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateYoutubeJobRequest;
    const depth = body.depth;
    console.log("depth", depth);
    const style = body.style;
    console.log("style", style);
    const includeTimestamps = body.includeTimestamps;
    console.log("includeTimestamps", includeTimestamps);
    const ytURL = body.url;

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
      deepDecode(segment.text)
    );

    const fullText = decodedTranscript.map((s) => s.trim()).filter(Boolean);

    console.log("full text", fullText);
    const characterLimit = 3800;

    // loop over the full text
    let counter = 0;
    let singleChunk: string[] = [];
    const transcriptChunks = [];
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
    console.log("transcript chunks", transcriptChunks.length);

    // Create the prompt for OpenAI API
    console.log("process.env.OPENAI_API_KEY", process.env.OPENAI_API_KEY);
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.responses.create({
      model: "gpt-5-nano",
      input: "Write a one-sentence bedtime story about a unicorn.",
    });

    console.log("response", response);

    return NextResponse.json({ summary: "this is a summary" }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 }
    );
  }
}
