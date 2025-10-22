import { NextRequest, NextResponse } from "next/server";
import { jobManager } from "@/lib/jobManager";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  if (!jobId)
    return NextResponse.json(
      { message: "No job id passed to end point" },
      { status: 500 }
    );
  try {
    const jobStatus = jobManager.get(jobId);
    console.log("jobStatus", jobStatus);
    if (!jobStatus) console.log("no status");

    return NextResponse.json(jobStatus);
  } catch (error) {
    console.error("error", error);
    return NextResponse.json(
      { message: "unexpected error", error: error },
      { status: 500 }
    );
  }
}
