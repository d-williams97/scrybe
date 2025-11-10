import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import type { CreateYoutubeJobRequest } from "@/app/types";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { query: string };
  const query = body.query;
  console.log("query", query);
}
