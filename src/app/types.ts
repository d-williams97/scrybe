// Shared application types for Scrybe
// Keep this file as the single source of truth for UI and API contracts

export type InputMode = "youtube" | "upload";

export type SummaryDepth = "brief" | "in_depth";

export type SummaryStyle =
  | "academic"
  | "casual"
  | "bullet"
  | "revision"
  | "paragraph";

export interface SummaryOptions {
  depth: SummaryDepth;
  style: SummaryStyle;
  includeTimestamps: boolean;
}

export interface NotesEditorProps {
  initialValue?: string;
}
