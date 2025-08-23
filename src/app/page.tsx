"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Play } from "lucide-react";
import { InputMode, SummaryDepth, Style } from "./types";

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // hook up file logic if needed
  };

  const handleSummarize = async () => {
    if (inputMode === "youtube" && !youtubeUrl.trim()) return;

    setIsLoading(true);
    setProgress(0);
    setShowNotes(false);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);

    setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);

      const mockNotes = `# ${
        style === "academic"
          ? "Academic Summary"
          : style === "casual"
          ? "Casual Notes"
          : style === "bullet"
          ? "Key Points"
          : style === "revision"
          ? "Revision Notes"
          : "Summary"
      }

## Overview
${
  summaryDepth === "brief"
    ? "Brief overview of the main concepts discussed in the video."
    : "In-depth analysis covering all major points and supporting details from the video content."
}
${
  style === "bullet"
    ? `• Main concept #1
• Key insight #2  
• Important detail #3
• Supporting evidence #4
• Conclusion point #5`
    : style === "paragraph"
    ? `This video covers several important concepts that are essential for understanding the topic. The presenter begins by introducing the foundational principles, then moves on to discuss more advanced applications. Throughout the presentation, various examples are provided to illustrate the key points. The content is structured in a logical progression that builds upon previously established concepts.

The middle section focuses on practical applications and real-world scenarios where these concepts become particularly relevant. Several case studies are examined in detail, providing concrete examples of how the theory translates into practice. This section is particularly valuable for viewers looking to apply the knowledge in their own work or studies.

The conclusion ties together all the main themes and provides actionable next steps for continued learning. The presenter also addresses common misconceptions and provides clarification on frequently confused aspects of the topic.`
    : `## Key Concepts
- Primary concept: Core idea discussed throughout the video
- Supporting theory: Background information and context
- Practical applications: Real-world use cases and examples

## Main Points
1. Introduction to the topic and its importance
2. Detailed explanation of fundamental principles  
3. Examples and case studies demonstrating application
4. Common challenges and how to overcome them
5. Best practices and recommendations

## Conclusion
Summary of key takeaways and next steps for implementation.`
}

${
  includeTimestamps
    ? `

## Timestamps
[00:30] Introduction and overview
[02:15] Main concept explanation
[05:45] Practical examples
[08:20] Advanced applications
[11:10] Common challenges
[13:45] Best practices
[16:20] Q&A and conclusion`
    : ""
}`;

      setGeneratedNotes(mockNotes);
      setShowNotes(true);
      setIsLoading(false);
      setProgress(0);
    }, 2000);
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

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute top-6 left-6 z-50 flex items-center">
        <Image
          src="/scrybe-logo.png"
          alt="Scrybe Logo"
          width={56}
          height={56}
        />
        <h2 className="ml-1 text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight">
          SCRYBE
        </h2>
      </div>

      <div className="viewport-glow flex flex-col items-center justify-center px-8 relative z-10">
        <div className="text-center max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-12 leading-tight">
            from videos to notes in seconds
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
              onClick={handleSummarize}
              disabled={
                isLoading || (inputMode === "youtube" && !youtubeUrl.trim())
              }
            >
              <Play className="w-4 h-4 mr-2" />
              {isLoading ? "Generating..." : "Summarize"}
            </Button>
          </div>

          {showNotes && (
            <div className="glow-card-intense p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Generated Notes
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
