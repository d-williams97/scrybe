import React from "react";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";

interface YouTubePanelProps {
  placeholder?: string;
}

export function YouTubePanel({ placeholder }: YouTubePanelProps) {
  return (
    <Card className="w-full max-w-3xl">
      <CardContent>
        <Input
          placeholder={placeholder ?? "https://www.youtube.com/watch?v=..."}
        />
      </CardContent>
    </Card>
  );
}

interface UploadPanelProps {
  helper?: string;
}

export function UploadPanel({ helper }: UploadPanelProps) {
  return (
    <Card className="w-full max-w-3xl">
      <CardContent>
        <div className="w-full border border-dashed rounded-md h-40 grid place-content-center text-center text-sm text-muted-foreground">
          <div>
            <div className="text-3xl mb-2">⬆️</div>
            <p>Upload or drag a file here</p>
            <p className="mt-1">
              {helper ?? "Supports .mp4 .mov .webm .mp3 .wav (≤ 20 min)"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
