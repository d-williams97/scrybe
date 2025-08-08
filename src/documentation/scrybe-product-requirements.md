# Product Requirements Document – **Scribe** (v 0.1)

## 1. Elevator Pitch

Scribe lets anyone paste a YouTube URL or drag-and-drop a local audio/video file (≤ 20 min, English) and instantly receive AI-generated notes. Users choose summary depth (brief or in-depth), style (academic, casual, bullet points, revision notes, paragraph), and whether to include clickable timestamps. Notes are editable on-screen and downloadable as plain text, helping learners decide quickly if full content deserves their time.

---

## 2. Who Is This App For?

- Students & lifelong learners who hoard educational content
- Busy professionals needing rapid take-aways from industry talks
- Podcast fans wanting previews before committing to full episodes
- Anyone overwhelmed by video/podcast volume seeking to save time

---

## 3. Functional Requirements (MVP)

| ID       | Requirement                       | Detail                                                                                                                                                          |
| -------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-1** | **Input Source**                  | Accept YouTube URL; drag-and-drop or file picker for local `.mp4`, `.mov`, `.webm`, `.mp3`, `.wav` (≤ 20 min).                                                  |
| **FR-2** | **Summary Depth**                 | Toggle: Brief (≈ 2-3 sentences) or In-depth (≈ 3-5 paragraphs).                                                                                                 |
| **FR-3** | **Summary Style**                 | Academic / Casual / Bullet points / Revision notes / Paragraph.                                                                                                 |
| **FR-4** | **Timestamps**                    | Boolean toggle; if _on_, notes include clickable HH:MM:SS links (YouTube deep-links or local player positions). Links shown only in UI, not in downloaded file. |
| **FR-5** | **Transcription & Summarization** | Speech-to-text + LLM pipeline generates transcript → summary per chosen options.                                                                                |
| **FR-6** | **Edit Notes**                    | In-browser editor (textarea / rich-text) allowing user tweaks before export.                                                                                    |
| **FR-7** | **Export**                        | Download final notes as plain-text (`.txt`).                                                                                                                    |
| **FR-8** | **Progress Feedback**             | Real-time progress bar or spinner while processing.                                                                                                             |
| **FR-9** | **Error Handling**                | Friendly messages for unsupported format, > 20 min length, or network issues.                                                                                   |

_Deferred_: Podcast-platform links, multi-language support, history list (DB), Markdown/PDF export.

---

## 4. User Stories

| ID     | As a…                | I want…                                                                                     | So that…                                        |
| ------ | -------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **U1** | Learner              | to paste a YouTube link and get a brief bullet-point summary with timestamps                | I can preview key points quickly.               |
| **U2** | Student              | to upload a 15-min `.mp4`, receive an in-depth academic summary, edit a typo, then download | I have study notes without re-watching.         |
| **U3** | Professional         | visual progress feedback during long uploads                                                | I know the app is still working.                |
| **U4** | Podcast fan (future) | to paste a Spotify link and get notes                                                       | I decide if the episode is worth a full listen. |

---

## 5. User Interface (MVP)

+-------------------------------------------------------+
| Scribe logo |
|-------------------------------------------------------|
| [URL input field] [Paste YouTube Link] |
| or |
| [ Drag-and-drop zone ] (.mp4 .mov .webm .mp3 .wav) |
|-------------------------------------------------------|
| Summary depth: (•) Brief ( ) In-depth |
| Style: Academic | Casual | Bullet | Revision | Para |
| Include timestamps: [x] Yes |
|-------------------------------------------------------|
| [ Summarize ▶ ] |
|-------------------------------------------------------|
| [Progress bar 0–100 % ▓▓▓░░] |
|-------------------------------------------------------|
| Transcript/Summary editor (textarea or rich text) |
|-------------------------------------------------------|
| [ Download .txt ] |
+-------------------------------------------------------+

- Clean, responsive layout; dark/light theme.\*
- Clickable timestamps: rendered as blue links inside notes
- Responsiveness: drag-drop zone shrinks to button on mobile
