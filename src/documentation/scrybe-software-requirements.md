# System Design

Single-page app that converts YouTube URLs or local media (≤20 min, EN) into editable AI notes with selectable depth, style, optional timestamps; export .txt.

## Server-side Operations

- Download audio from YouTube via ytdl-core
- STT via OpenAI Whisper API
- LLM summarization via OpenAI
- Real-time progress feedback; friendly error states for unsupported format/length/network
- No user accounts/history in MVP

## Architecture Pattern

- Next.js App Router SPA + serverless API routes within the same project (no separate BFF service)
- Node runtime for media streaming/transcoding; Edge middleware optional for lightweight validation/rate limiting
- URL dispatcher on the server:
  - YouTube → ytdl-core audio-only stream
  - Local file upload path (multipart)
  - Extensible provider interface for future platforms

## State Management

- Local UI: React useState/useReducer for inputs, options, editor content
- Server/async state: SWR or React Query for job lifecycle (create → poll → fetch result)
- Optional global UI store: Zustand (to avoid prop-drilling)
- Shared Types: keep all API/request/response/status enums in src/types.ts (TypeScript file for IDE/type safety)

## Data Flow

### YouTube URL Path

1. Client submits URL + options → POST /api/process/youtube
2. Server validates URL → ytdl-core downloads audio-only stream → stream to Whisper → transcript with timestamps
3. Summarize with OpenAI (depth/style, optional timestamp alignment) → return job result

### Local File Path

1. Client uploads (≤20 min) via multipart to /api/process/upload → stream to Whisper → summarize → return result

### Progress

- POST returns { jobId }; client polls GET /api/jobs/{id} for { status, progress } until ready | error

## Technical Stack

- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Next.js API routes (Node 18+), streaming enabled; Vercel hosting
- Media acquisition: ytdl-core for YouTube audio
- STT: OpenAI Whisper API
- LLM: OpenAI for summarization
- Storage: none required in MVP; temporary memory/KV for job status; optional temp object storage for uploads
- Observability: structured logs; normalized provider errors; optional Sentry
- Guardrails: 20‑minute cap, file type whitelist, size limits, per‑IP rate limiting
- Reference: ytdl-core on npm ytdl-core

## Authentication Process

- MVP: anonymous usage
- Protections: CSRF on POST, strict CORS, rate limiting, server-only API keys, input validation, upload scanning/size checks

## Route Design

### Pages

- / — Single-page interface (URL input, dropzone, options, progress, editor, download)

### API

- POST /api/process/youtube → body: { url, options } → { jobId }
- POST /api/process/upload → multipart { file, options } → { jobId }
- GET /api/jobs/{jobId} → { status, progress, transcript?, summary?, error? }
- POST /api/export/txt (optional; client can also export locally) → { content } → text/plain

## API Design

### Options

- depth: brief | in_depth
- style: academic | casual | bullet | revision | paragraph
- timestamps: boolean

### Status Model

queued → downloading → transcribing → summarizing → ready | error

### YouTube Processing

Validate/parse videoId → ytdl-core fetch audio-only stream → stream to Whisper → normalize segments { start:number, end:number, text:string }[]

### Summarization

Prompt uses depth/style; when timestamps=true, align bullets to nearest segment start and format HH:MM:SS (deep-link for YouTube)

### Errors

- 400 invalid URL/unsupported type/over-duration
- 413 payload too large
- 422 validation
- 429 rate limit
- 502 provider failure
- 504 timeout

Note on types: place all shared contracts and enums in src/types.ts (TypeScript). Using .js would forfeit compile‑time guarantees in your TS stack.

## Database Design ERD

MVP: no persistent DB; jobs are ephemeral (in-memory/KV with TTL)

Future (when enabling history/usage):

### Entities

- User(user_id, email, created_at)
- Job(job_id, user_id?, source_type, source_ref, status, created_at, completed_at, duration_s)
- Transcript(job_id, lang, segments_json)
- Summary(job_id, options_json, content_text)
- File(job_id, storage_url, bytes, mime_type, length_s)

### Relationships

- User 1—\* Job
- Job 1—1 Transcript
- Job 1—1 Summary
- Job 1—0..1 File

Adopted your stack and constraints (OpenAI Whisper, strict ytdl-core, no extra BFF, shared types in src/types.ts).
Provided concise SRS aligned to PRD/UI, with endpoints, flows, and future-ready ERD.
