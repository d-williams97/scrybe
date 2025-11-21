export type SummaryStyle =
  | "academic"
  | "casual"
  | "bullet"
  | "revision"
  | "paragraph";

export type InputMode = "youtube" | "upload";
export type SummaryDepth = "brief" | "in-depth";
export type Style =
  | "academic"
  | "casual"
  | "bullet-points"
  | "revision-notes"
  | "paragraph";

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

export interface Matches {
  id: string;
  score: number;
  values: number[];
  sparseValues: number[] | undefined;
  metadata: RAGMetadata;
}
export interface RAGMetadata {
  chunkIndex: number;
  duration: number;
  offset: number;
  text: string;
  videoId: string;
  videoTitle: string;
}

export interface QueryResponse {
  answer: string;
  metadata?: {
    contextQuality: "insufficient" | "comprehensive" | "ambiguous" | "error";
    strategy: "strict_rag" | "hybrid" | "error";
    metrics?: {
      chunkCount: number;
      totalWords: number;
      avgScore: number;
      keywordCoverage: number;
      maxScore: number;
    };
    suggestion?: string;
    llmEvaluation?: {
      coverage: number;
      depth: string;
      reasoning: string;
    };
    error?: string;
  };
}
