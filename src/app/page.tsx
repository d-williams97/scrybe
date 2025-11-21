"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Play } from "lucide-react";
import { InputMode, SummaryDepth, Style } from "./types";
import { Message } from "@/components/Message";
import { nanoid } from "nanoid";

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [summaryDepth, setSummaryDepth] = useState<SummaryDepth>("brief");
  const [style, setStyle] = useState<Style>("academic");
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [progress, setProgress] = useState(0);
  const [queries, setQueries] = useState<
    { index: number; query: string; answer: string; queryId: string }[]
  >([]);
  const [currentQuery, setCurrentQuery] = useState<string>("");
  const [videoId, setVideoId] = useState<string>("");
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // hook up file logic if needed
  };

  const handleSummarise = async () => {
    if (inputMode === "youtube" && !youtubeUrl.trim()) return;

    console.log("youtubeUrl", youtubeUrl);

    setIsLoading(true);
    setProgress(0);
    setShowNotes(false);

    try {
      const res = await fetch("/api/youtubeSummary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: youtubeUrl.trim(),
          depth: summaryDepth,
          style: style,
          includeTimestamps,
        }),
      });
      if (!res.ok) {
        setIsLoading(false);
        setProgress(0);
        setShowNotes(false);
        console.log("summarise failed");
        throw new Error("Failed to start job");
      }

      const response = await res.json();
      console.log("response", response.summary);
      setGeneratedNotes(response.summary);
      setVideoId(response.videoId);
      setShowNotes(true);
      setIsLoading(false);
      setProgress(100);
    } catch {
      console.log("job failed");
      setIsLoading(false);
      setProgress(0);
      // setGeneratedNotes(`Error starting job.`);
      setShowNotes(true);
    }
  };

  const downloadNotes = () => {
    const blob = new Blob([generatedNotes], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scrybe-notes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleQuestionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log("handleQuestionSubmit");
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const query = formData.get("query") as string;
    const sanitisedQuery = query.trim();
    console.log("sanitisedQuery", sanitisedQuery);
    if (sanitisedQuery.length < 1) return;
    const queryId = nanoid();
    setQueries((prev) => [
      ...prev,
      {
        answer: "",
        index: prev.length + 1,
        query: sanitisedQuery,
        queryId: queryId,
      },
    ]);
    setCurrentQuery("");
    await queryVideo(sanitisedQuery, videoId, queryId);
  };

  const queryVideo = async (
    query: string,
    videoId: string,
    queryId: string
  ) => {
    try {
      console.log("queryVideo");
      console.log("query", query);
      console.log("videoId", videoId);
      if (query.length < 0 || !videoId) return;
      console.log("query", query);
      console.log("videoId", videoId);
      console.log("queryId", queryId);
      const res = await fetch("/api/youtubeQuery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, videoId }),
      });
      if (!res.ok) {
        throw new Error("Failed to query video");
      }
      const response = await res.json();
      console.log("response", response.answer);
      setQueries((prev) => {
        return prev.map((q) =>
          q.queryId === queryId
            ? { ...q, answer: response.answer } // Update the matching query
            : q
        );
      });
      // setIsLoading(false);
      // setProgress(100);
    } catch (error) {
      console.error("Error querying video", error);
      return;
    }
  };

  console.log("queries", queries);

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute z-50 flex items-center">
        <Image
          src="/scrybe-logo.png"
          alt="Scrybe Logo"
          width={120}
          height={120}
        />
        <h2 className="ml-1 text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight relative right-8">
          SCRYBE
        </h2>
      </div>

      <div className="viewport-glow flex flex-col items-center justify-center px-8 relative z-10">
        <div className="text-center max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-12 leading-tight">
            turn youtube videos into notes in seconds
          </h1>

          <div className="flex justify-center gap-2 mb-6">
            <Button
              variant={inputMode === "youtube" ? "default" : "outline"}
              onClick={() => setInputMode("youtube")}
              className="rounded-lg text-lg px-8 py-4"
            >
              YouTube
            </Button>
            <Button
              variant={inputMode === "upload" ? "default" : "outline"}
              onClick={() => setInputMode("upload")}
              className="rounded-lg text-lg px-8 py-4"
            >
              Upload
            </Button>
          </div>

          <p className="text-gray-400 text-sm md:text-base font-medium tracking-wide uppercase">
            {inputMode === "upload"
              ? "Transcribe and summarise a video through file upload"
              : "Transcribe and summarise a video by pasting a youtube link"}
          </p>
        </div>
      </div>

      <div className="relative z-20 bg-background">
        <div className="max-w-4xl mx-auto space-y-8 px-8 py-8">
          <div className="p-8 bg-background border border-white/10 rounded-lg">
            {inputMode === "youtube" ? (
              <div className="glow-input">
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full text-center py-6 text-lg border-2 rounded-lg bg-input-background text-white placeholder-gray-400"
                />
              </div>
            ) : (
              <div
                className="glow-dropzone border-2 border-dashed border-gray-600 rounded-lg p-12 text-center space-y-4 hover:border-gray-400 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="flex justify-center">
                  <Upload className="w-12 h-12 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg text-gray-300">
                    Upload or drag a file here
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports .mp4 .mov .webm .mp3 .wav (≤ 20 min)
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="glow-card p-6">
            <h3 className="text-lg font-semibold mb-6 text-white">Options</h3>

            <div className="space-y-6">
              <div>
                <label className="block mb-3 text-white">Summary depth</label>
                <div className="flex gap-2">
                  <Button
                    variant={summaryDepth === "brief" ? "default" : "outline"}
                    onClick={() => setSummaryDepth("brief")}
                    className="rounded-lg"
                  >
                    Brief
                  </Button>
                  <Button
                    variant={
                      summaryDepth === "in-depth" ? "default" : "outline"
                    }
                    onClick={() => setSummaryDepth("in-depth")}
                    className="rounded-lg"
                  >
                    In-depth
                  </Button>
                </div>
              </div>

              <div>
                <label className="block mb-3 text-white">Style</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "academic", label: "Academic" },
                    { value: "casual", label: "Casual" },
                    { value: "bullet-points", label: "Bullet Points" },
                    { value: "revision-notes", label: "Revision Notes" },
                    { value: "paragraph", label: "Paragraph" },
                  ].map(({ value, label }) => (
                    <Button
                      key={value}
                      variant={
                        style === (value as Style) ? "default" : "outline"
                      }
                      onClick={() => setStyle(value as Style)}
                      className="rounded-lg"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timestamps"
                  checked={includeTimestamps}
                  onCheckedChange={(checked) => setIncludeTimestamps(checked)}
                />
                <label
                  htmlFor="timestamps"
                  className="cursor-pointer text-white"
                >
                  Include clickable timestamps
                </label>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-white text-lg">Generating your notes...</p>
              </div>
              <div className="rainbow-progress h-3">
                <div
                  className="rainbow-progress-fill h-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <Button
              className="px-8 py-3 rounded-lg"
              onClick={handleSummarise}
              disabled={
                isLoading || (inputMode === "youtube" && !youtubeUrl.trim())
              }
            >
              <Play className="w-4 h-4 mr-2" />
              {isLoading ? "Generating..." : "Summarise"}
            </Button>
          </div>

          {showNotes && (
            <div className="glow-card-intense p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Generated Video Notes
                </h3>
                <Button
                  variant="outline"
                  onClick={downloadNotes}
                  className="rounded-lg"
                >
                  Download .txt
                </Button>
              </div>

              <Textarea
                value={generatedNotes}
                onChange={(e) => setGeneratedNotes(e.target.value)}
                className="min-h-[300px] font-mono text-sm resize-none"
                placeholder="Your generated notes will appear here..."
              />

              {generatedNotes.length > 0 && showNotes && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Video Query
                  </h3>
                  {queries.map((query) => (
                    <div key={query.index} className="mb-[1rem]">
                      <Message
                        className="mb-[1rem]"
                        text={query.query}
                        key={query.index}
                      />
                      <div className="text-white">{query.answer}</div>
                    </div>
                  ))}
                  <form onSubmit={handleQuestionSubmit}>
                    <Input
                      type="text"
                      placeholder="Ask a question about the video"
                      value={currentQuery}
                      name="query"
                      onChange={(e) => {
                        setCurrentQuery(e.target.value);
                      }}
                      className="w-full py-3 text-base border-2 rounded-lg bg-input-background text-white placeholder-gray-400"
                    />
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
