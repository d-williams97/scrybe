import { NextRequest, NextResponse } from "next/server";
import { jobManager } from "@/lib/jobManager";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  if (!jobId)
    return NextResponse.json(
      { error: "Bad request: No job id passed to end point" },
      { status: 400 }
    );
  try {
    console.log("jobs liost", jobManager.jobs);
    const jobStatus = jobManager.get(jobId);
    if (!jobStatus) console.log("no status");

    return NextResponse.json(jobStatus);
  } catch (error) {
    console.error("error", error);
    return NextResponse.json(
      { error: "Internal server error: " + error },
      { status: 500 }
    );
  }
}
