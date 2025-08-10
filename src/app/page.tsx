"use client";

import React from "react";
import { Hero } from "@/components/Hero";
import { ModeToggle } from "@/components/ModeToggle";
import { YouTubePanel, UploadPanel } from "@/components/InputPanels";
import { OptionsPanel } from "@/components/OptionsPanel";
import { ActionBar } from "@/components/ActionBar";
import { NotesEditor } from "@/components/NotesEditor";
import { InputMode, SummaryOptions } from "./types";

export default function Home() {
  const [mode, setMode] = React.useState<InputMode>("youtube");
  const [options, setOptions] = React.useState<SummaryOptions>({
    depth: "brief",
    style: "academic",
    includeTimestamps: true,
  });

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-4 py-10">
      {/* Header placeholder to match minimal top-left logo in UI doc; logo can be added in layout.tsx */}
      <main className="w-full flex flex-col items-center gap-6">
        <Hero title="from videos to notes in seconds" />
        <ModeToggle mode={mode} onChange={setMode} />

        {mode === "youtube" ? (
          <YouTubePanel placeholder="https://www.youtube.com/watch?v=..." />
        ) : (
          <UploadPanel />
        )}

        <OptionsPanel value={options} onChange={setOptions} />

        <ActionBar />

        <NotesEditor
          initialValue={`# Summary Notes\n\n## Key Points\n- This is a sample generated summary based on your selected options\n- Summary depth: ${
            options.depth
          }\n- Style: ${options.style}\n- Timestamps: ${
            options.includeTimestamps ? "Included" : "Excluded"
          }\n\n## Timestamps\n[00:30] Introduction to the main topic\n[02:15] Key concept explanation\n[05:45] Practical example\n[08:20] Conclusion and takeaways\n\n## Content Overview\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`}
        />
      </main>
    </div>
  );
}
