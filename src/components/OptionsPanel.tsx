import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { SummaryOptions, SummaryDepth, SummaryStyle } from "@/app/types";

interface OptionsPanelProps {
  value: SummaryOptions;
  onChange: (value: SummaryOptions) => void;
}

const styles: { key: SummaryStyle; label: string }[] = [
  { key: "academic", label: "Academic" },
  { key: "casual", label: "Casual" },
  { key: "bullet", label: "Bullet Points" },
  { key: "revision", label: "Revision Notes" },
  { key: "paragraph", label: "Paragraph" },
];

export function OptionsPanel({ value, onChange }: OptionsPanelProps) {
  const setDepth = (depth: SummaryDepth) => onChange({ ...value, depth });
  const setStyle = (style: SummaryStyle) => onChange({ ...value, style });
  const toggleTimestamps = () =>
    onChange({ ...value, includeTimestamps: !value.includeTimestamps });

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="mb-2">Summary depth</Label>
          <div className="flex items-center gap-4 mt-2">
            <button
              type="button"
              className={cn(
                buttonVariants({
                  variant: value.depth === "brief" ? "default" : "outline",
                  size: "sm",
                })
              )}
              onClick={() => setDepth("brief")}
            >
              Brief
            </button>
            <button
              type="button"
              className={cn(
                buttonVariants({
                  variant: value.depth === "in_depth" ? "default" : "outline",
                  size: "sm",
                })
              )}
              onClick={() => setDepth("in_depth")}
            >
              In-depth
            </button>
          </div>
        </div>

        <div>
          <Label className="mb-2">Style</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {styles.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={cn(
                  buttonVariants({
                    variant: value.style === key ? "default" : "outline",
                    size: "sm",
                  })
                )}
                onClick={() => setStyle(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="timestamps"
            type="checkbox"
            className="size-4 accent-black"
            checked={value.includeTimestamps}
            onChange={toggleTimestamps}
          />
          <Label htmlFor="timestamps">Include clickable timestamps</Label>
        </div>
      </CardContent>
    </Card>
  );
}
