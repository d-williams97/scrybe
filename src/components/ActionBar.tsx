import React from "react";
import { Button } from "./ui/button";

interface ActionBarProps {
  onSummarize?: () => void;
}

export function ActionBar({ onSummarize }: ActionBarProps) {
  return (
    <div className="w-full max-w-3xl flex items-center justify-center">
      <Button onClick={onSummarize} className="min-w-40">
        ▶ Summarize
      </Button>
    </div>
  );
}
