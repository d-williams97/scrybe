"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Play } from "lucide-react";
import { SummaryDepth, Style, Queries } from "./types";
import { nanoid } from "nanoid";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import YouTube, { YouTubeEvent } from "react-youtube";

export default function Home() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [summaryDepth, setSummaryDepth] = useState<SummaryDepth>("brief");
  const [style, setStyle] = useState<Style>("academic");
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [queries, setQueries] = useState<Queries[]>([]);
  const [currentQuery, setCurrentQuery] = useState<string>("");
  const [videoId, setVideoId] = useState<string>("");
  const notesSectionRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const videoPlayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (generatedNotes.length > 0 && notesSectionRef.current) {
      setTimeout(() => {
        notesSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [generatedNotes]);

  type DownloadFormat = "txt" | "md" | "pdf";

  // Helper function to remove timestamps (mm:ss) from text
  const removeTimestamps = (text: string): string => {
    return text.replace(/\s*\(\d{2}:\d{2}\)/g, "");
  };

  // Helper function to strip markdown formatting (remove # and * but keep - for bullets)
  const stripMarkdownFormatting = (text: string): string => {
    let result = text;
    // Remove heading markers (##, ###, etc.) - replace with just the text
    result = result.replace(/^#{1,6}\s+/gm, "");
    // Remove bold (**text**)
    result = result.replace(/\*\*(.+?)\*\*/g, "$1");
    // Remove italic (*text* but not bullet points)
    result = result.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, "$1");
    return result;
  };

  const downloadNotes = async (format: DownloadFormat): Promise<void> => {
    if (!generatedNotes) return;

    // Process content based on format
    let content = generatedNotes;

    if (format === "md") {
      // For markdown: only remove timestamps
      content = removeTimestamps(content);
    } else {
      // For txt and pdf: remove timestamps and markdown formatting
      content = removeTimestamps(content);
      content = stripMarkdownFormatting(content);
    }

    if (format === "pdf") {
      // Create a simple PDF with the notes text
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      const margin = 50;
      const lineHeight = fontSize + 4;
      const maxWidth = width - margin * 2;

      // Basic word-wrap
      const words = content.split(/\s+/);
      const lines: string[] = [];
      let currentLine = "";

      words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (textWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) lines.push(currentLine);

      let y = height - margin;
      for (const line of lines) {
        if (y < margin) break; // simple single-page guard
        page.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          font,
        });
        y -= lineHeight;
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "scrybe-notes.pdf";
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // txt and md: same plain text content, different extension
    const extension = format === "md" ? "md" : "txt";

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scrybe-notes.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Callback to save player instance
  const onPlayerReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
  };

  // Function to jump to time
  const handleTimestampClick = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, true);
      playerRef.current.playVideo(); // Optional: ensure it plays

      // Scroll to player smoothly
      videoPlayerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const handleSummarise = async () => {
    setGeneratedNotes("");
    setVideoId("");
    setQueries([]);
    if (!youtubeUrl.trim()) return;

    setIsLoading(true);

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
      if (!res.ok || !res.body) {
        setIsLoading(false);
        throw new Error("Failed to start job");
      }

      const reader = res.body.getReader(); // getReader: a Web Streams API method that returns a reader object that allows you to read the stream.
      const decoder = new TextDecoder(); // TextDecoder: a Web API that allows you to decode a stream of Uint8Array  bytes into a string.
      let summary = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Flush any remaining buffered bytes from incomplete multi-byte sequences
          const finalChunk = decoder.decode();
          if (finalChunk) {
            summary += finalChunk;
            setGeneratedNotes(summary);
          }
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        // Check for videoId marker
        if (chunk.includes("__VIDEO_ID__:")) {
          const [text, videoIdPart] = chunk.split("__VIDEO_ID__:");
          summary += text;
          setVideoId(videoIdPart.trim());
        } else {
          summary += chunk;
          setGeneratedNotes(summary); // Update in real-time
        }
      }
      setIsLoading(false);
    } catch {
      console.log("job failed");
      setIsLoading(false);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const query = formData.get("query") as string;
    const sanitisedQuery = query.trim();
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

  const [isQuerying, setIsQuerying] = useState(false);
  const queryVideo = async (
    query: string,
    videoId: string,
    queryId: string
  ) => {
    setIsQuerying(true);
    try {
      if (query.length < 1 || !videoId) {
        setIsQuerying(false);
        return;
      }

      const res = await fetch("/api/youtubeQuery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, videoId }),
      });

      if (!res.ok) {
        setIsQuerying(false);
        // Try to parse error as JSON
        try {
          const errorData = await res.json();
          const errorMessage =
            errorData.answer ||
            errorData.error ||
            "Sorry, something went wrong. Please try again.";
          setQueries((prev) =>
            prev.map((q) =>
              q.queryId === queryId ? { ...q, answer: errorMessage } : q
            )
          );
        } catch {
          setIsQuerying(false);
          setQueries((prev) =>
            prev.map((q) =>
              q.queryId === queryId
                ? {
                    ...q,
                    answer: "Sorry, something went wrong. Please try again.",
                  }
                : q
            )
          );
        }
        return;
      }

      // Check Content-Type to determine response format
      const contentType = res.headers.get("Content-Type") || "";

      if (contentType.includes("application/json")) {
        // Handle JSON response (error/insufficient context cases)
        const jsonData = await res.json();
        const answer =
          jsonData.answer || "No answer available for this question.";
        setQueries((prev) =>
          prev.map((q) =>
            q.queryId === queryId ? { ...q, answer: answer } : q
          )
        );
        setIsQuerying(false);
      } else {
        // Handle streaming response (success cases)
        if (!res.body) {
          setIsQuerying(false);
          throw new Error("No response body");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let answer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Flush any remaining buffered bytes from incomplete multi-byte sequences
            const finalChunk = decoder.decode();
            if (finalChunk) {
              answer += finalChunk;
              setQueries((prev) =>
                prev.map((q) =>
                  q.queryId === queryId ? { ...q, answer: answer } : q
                )
              );
            }
            setIsQuerying(false);
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          answer += chunk;
          setQueries((prev) =>
            prev.map((q) =>
              q.queryId === queryId ? { ...q, answer: answer } : q
            )
          );
        }
      }
    } catch (error) {
      console.error("Error querying video", error);
      setIsQuerying(false);
      setQueries((prev) =>
        prev.map((q) =>
          q.queryId === queryId
            ? { ...q, answer: "Sorry, an error occurred. Please try again." }
            : q
        )
      );
    }
  };

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

          <p className="text-gray-400 text-md md:text-lg font-medium tracking-wide uppercase">
            Transcribe and summarise a video by pasting a youtube link below
          </p>
        </div>
      </div>

      <div className="relative z-20 bg-background">
        <div className="max-w-4xl mx-auto space-y-8 px-8 py-8">
          <div className="p-8 bg-background border border-white/10 rounded-lg">
            <div className="glow-input">
              <Input
                aria-label="YouTube URL"
                placeholder="Paste a youtube link here"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full text-center py-6 text-lg border-2 rounded-lg bg-input-background text-white placeholder-gray-400"
              />
            </div>
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
              <span className="animate-pulse bg-gradient-to-r from-[#ff006e] via-[#8b5cf6] to-[#06ffa5] bg-clip-text text-transparent">
                Summarising video into notes...
              </span>
            </div>
          )}

          <div className="flex justify-center">
            <Button
              className="px-8 py-3 rounded-lg"
              onClick={handleSummarise}
              disabled={isLoading || !youtubeUrl.trim() || isQuerying}
            >
              <Play className="w-4 h-4 mr-2" />
              {isLoading
                ? "Summarising..."
                : isQuerying
                ? "Thinking"
                : "Summarise"}
            </Button>
          </div>

          {generatedNotes.length > 0 && (
            <div className="glow-card-intense p-6" ref={notesSectionRef}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-white">
                  Generated Video Notes
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="outline" className="rounded-lg">
                      Download
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => downloadNotes("txt")}>
                      Plain Text (.txt)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadNotes("md")}>
                      Markdown (.md)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadNotes("pdf")}>
                      PDF (.pdf)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="min-h-[300px] bg-white/5 rounded-lg p-4 overflow-y-auto">
                <MarkdownRenderer
                  content={generatedNotes}
                  onTimestampClick={handleTimestampClick}
                />
              </div>

              {/* Embedded YouTube video preview – only shown once a video has been summarised */}
              {videoId && (
                <div
                  ref={videoPlayerRef}
                  className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-black"
                >
                  <div className="relative w-full pb-[56.25%]">
                    <YouTube
                      videoId={videoId}
                      onReady={onPlayerReady}
                      opts={{
                        width: "100%",
                        height: "100%",
                        playerVars: { autoplay: 0, rel: 0 },
                      }}
                      className="absolute inset-0 h-full w-full"
                      iframeClassName="w-full h-full" // Important for responsive sizing
                    />
                  </div>
                </div>
              )}

              {generatedNotes.length > 0 && (
                <div className="mt-8 border-t border-white/10 pt-6">
                  <div className="relative">
                    {/* Scrollable container for messages */}
                    <div className="max-h-[400px] overflow-y-auto mb-4 pr-2 space-y-4 custom-scrollbar">
                      {queries.length === 0 && (
                        <h3 className="text-lg font-semibold mb-4 text-center bg-gradient-to-r from-[#ff006e] via-[#8b5cf6] to-[#06ffa5] bg-clip-text text-transparent">
                          Ask Scrybe a question about the video content.
                        </h3>
                      )}
                      {queries.map((query) => (
                        <div key={query.index} className="mb-4">
                          <div className="flex justify-end mb-2">
                            <div className="bg-primary/20 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%]">
                              {query.query}
                            </div>
                          </div>
                          <div className="flex justify-start">
                            <div className="bg-white/5 text-gray-200 px-4 py-2 rounded-2xl rounded-tl-sm max-w-[90%] border border-white/10">
                              {query.answer ? (
                                <MarkdownRenderer
                                  content={query.answer}
                                  onTimestampClick={handleTimestampClick}
                                />
                              ) : (
                                <span className="animate-pulse bg-gradient-to-r from-[#ff006e] via-[#8b5cf6] to-[#06ffa5] bg-clip-text text-transparent">
                                  Thinking...
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Fixed position input area within the relative container */}
                    <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-2 pb-1 border-t border-white/5">
                      <form
                        onSubmit={handleQuestionSubmit}
                        className="relative"
                      >
                        <Input
                          type="text"
                          placeholder="Ask Scrybe a question about the video..."
                          value={currentQuery}
                          name="query"
                          onChange={(e) => setCurrentQuery(e.target.value)}
                          className="w-full h-12 pl-4 pr-12 text-base border border-white/20 rounded-xl bg-white/5 text-white placeholder-gray-400 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                          disabled={isQuerying}
                        />
                        <Button
                          type="submit"
                          size="icon"
                          variant="ghost"
                          className="absolute right-1 top-1 bottom-1 text-primary hover:text-primary/80 hover:bg-transparent"
                          disabled={!currentQuery.trim() || isQuerying}
                          aria-label="Submit question"
                        >
                          <Play className="w-5 h-5" />
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
