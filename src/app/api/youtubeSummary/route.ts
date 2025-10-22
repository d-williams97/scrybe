import { NextRequest, NextResponse } from "next/server";
import ytdl from "ytdl-core";
import { OpenAI } from "openai";
import { jobManager } from "@/lib/jobManager";
import type { CreateYoutubeJobRequest } from "@/app/types";

// Placeholder API key usage
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "OPENAI_API_KEY_PLACEHOLDER",
});

async function processYoutube(jobId: string, url: string, options: any) {
  console.log("jobId", jobId);
  console.log("url", url);
  console.log("options", options);
  // 1) Download audio-only stream
  jobManager.update(jobId, { status: "downloading", progress: 10 });
  const stream = ytdl(url, { quality: "highestaudio", filter: "audioonly" });

  // 2) Transcribe with Whisper API (placeholder streaming upload)
  jobManager.update(jobId, { status: "transcribing", progress: 40 });
  // NOTE: In a real implementation you'd pipe to a temp file or multipart stream.
  // Here we simulate the call and timing instead of actually uploading the stream.
  await new Promise((r) => setTimeout(r, 1500));
  const mockTranscript =
    "[00:00] Intro...\n[00:30] Key point...\n[02:00] Conclusion...";

  // 3) Summarize using OpenAI
  jobManager.update(jobId, { status: "summarizing", progress: 70 });
  await new Promise((r) => setTimeout(r, 800));
  // call open ai to summarising the transcript with options
  //   const summary = await openai.chat.completions.create({
  //     model: "gpt-4o-mini",
  //     messages: [{ role: "user", content: `Summarise the following transcript: ${mockTranscript} with the following options: ${options}` }],
  //   });
  const mockSummary = `Summary (${options?.depth ?? "brief"}, ${
    options?.style ?? "academic"
  })`;

  // 4) Finish
  jobManager.succeed(jobId, {
    transcript: mockTranscript,
    summary: mockSummary,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateYoutubeJobRequest;
    if (!body?.url) {
      return NextResponse.json({ error: "Missing url" }, { status: 422 });
    }

    const isValid = ytdl.validateURL(body.url);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    const job = jobManager.create();
    console.log("jobbbbb", job);

    // Kick off async processing without blocking the response
    void processYoutube(job.id, body.url, body.options).catch((err) => {
      console.error(err);
      jobManager.fail(job.id, "Processing failed");
    });

    return NextResponse.json({ jobId: job.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
