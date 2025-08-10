import React from "react";
import { InputMode } from "@/app/types";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

interface ModeToggleProps {
  mode: InputMode;
  onChange: (mode: InputMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        type="button"
        className={cn(
          buttonVariants({
            variant: mode === "youtube" ? "default" : "outline",
            size: "sm",
          })
        )}
        onClick={() => onChange("youtube")}
      >
        YouTube
      </button>
      <button
        type="button"
        className={cn(
          buttonVariants({
            variant: mode === "upload" ? "default" : "outline",
            size: "sm",
          })
        )}
        onClick={() => onChange("upload")}
      >
        Upload
      </button>
    </div>
  );
}
