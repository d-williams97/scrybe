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

export type InputMode = "youtube" | "upload";
export type SummaryDepth = "brief" | "in-depth";
export type Style = "academic" | "casual" | "bullet" | "revision" | "paragraph";
