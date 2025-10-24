import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
// import { jobManager } from "@/lib/jobManager";
import type { CreateYoutubeJobRequest } from "@/app/types";
import ytdl from "ytdl-core";
import { fetchTranscript } from "youtube-transcript-plus";
import { decode } from "he";

export const runtime = "nodejs"; // It forces this route to run on the Node.js runtime,
// Placeholder API key usage
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "OPENAI_API_KEY_PLACEHOLDER",
});

//   // 3) Summarize using OpenAI
//   jobManager.update(jobId, { status: "summarizing", progress: 70 });
//   await new Promise((r) => setTimeout(r, 800));
//   // call open ai to summarising the transcript with options
//   //   const summary = await openai.chat.completions.create({
//   //     model: "gpt-4o-mini",
//   //     messages: [{ role: "user", content: `Summarise the following transcript: ${mockTranscript} with the following options: ${options}` }],
//   //   });
//   const mockSummary = `Summary (${options?.depth ?? "brief"}, ${
//     options?.style ?? "academic"
//   })`;

//   // 4) Finish
//   jobManager.succeed(jobId, {
//     transcript: mockTranscript,
//     summary: mockSummary,
//   });
// }
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateYoutubeJobRequest;

    if (!body?.url) {
      return NextResponse.json({ error: "Missing url" }, { status: 422 }); // unprocessable content
    }

    const ytURL = body.url;
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
    for (let i = 0; i < fullText.length; i++) {
      // create new chunk(array of text)
      if (counter >= characterLimit) {
        transcriptChunks.push(singleChunk);
        singleChunk = [];
        counter = 0;
      }
      singleChunk.push(fullText[i]);
      counter += fullText[i].length;
    }

    console.log("transcript chunks", transcriptChunks.length);

    throw new Error("test");

    // create the prompt for each chunk by appending the other inputs from the ladning page form

    return NextResponse.json({ jobId: job.id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error: " + e },
      { status: 500 }
    );
  }
}
