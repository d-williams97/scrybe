export type SummaryStyle =
  | "academic"
  | "casual"
  | "bullet"
  | "revision"
  | "paragraph";

export type InputMode = "youtube" | "upload";
export type SummaryDepth = "brief" | "in-depth";
export type Style = "academic" | "casual" | "bullet" | "revision" | "paragraph";

export interface NotesEditorProps {
  initialValue?: string;
}

// Job processing types for API
export type JobStatus =
  | "queued"
  | "downloading"
  | "transcribing"
  | "summarizing"
  | "ready"
  | "error";

export interface JobResult {
  transcript?: string;
  summary?: string;
  error?: string;
}

export interface Job {
  id: string;
  status: JobStatus;
  progress: number; // 0..100
  result?: JobResult;
  createdAt: number;
}

export interface CreateYoutubeJobRequest {
  url: string;
  depth: SummaryDepth;
  style: SummaryStyle;
  includeTimestamps: boolean;
}

export interface CreateJobResponse {
  jobId: string;
}

export type GetJobResponse = Job;
