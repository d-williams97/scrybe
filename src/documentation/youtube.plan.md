## Plan: Improve YouTube RAG Behavior

### Goals

- Make responses honest when the video does not cover the user’s question.
- Provide richer answers when the video barely touches a topic, without hiding what comes from the video vs general knowledge.
- Stabilize retrieval by tuning thresholds and adding an answerability check.

### High-Level Steps

1. Clarify Answering Modes

- Define two modes for the query API:
- `video_strict`: answers must come only from the video transcript.
- `video_plus_general`: answer from video first, then optionally expand with general knowledge.
- Expose this as a parameter on the query endpoint (or infer from UI toggle).

2. Add Answerability / Relevance Check

- After retrieving top-k chunks from Pinecone, run a lightweight LLM step that:
- Determines if the question is on-topic for the video at all.
- Determines if the retrieved context is sufficient to answer in detail.
- Use a structured prompt that returns a small JSON with fields like `is_relevant`, `enough_context`, and `reason`.

3. Define Behaviors for Key Cases

- Case A: `is_relevant = false`
- Respond with a clear message: the video does not contain information about the topic.
- Optionally suggest the user ask a general (non-video-specific) question.
- Case B: `is_relevant = true` but `enough_context = false`
- In `video_strict` mode: provide a concise summary of what the video does say and clearly state its limits.
- In `video_plus_general` mode: first state what the video says, then expand with clearly labeled general knowledge.
- Case C: `is_relevant = true` and `enough_context = true`
- Answer normally, grounded in the retrieved chunks, citing timestamps.

4. Tune Retrieval Parameters

- Replace hard `scoreThreshold` with a softer strategy:
- Always retrieve top-k (e.g., 6–10) chunks.
- Inspect the highest similarity score; if it is very low, treat as `is_relevant = false` candidate.
- Adjust k by video length and query type (short factual vs broad conceptual question).
- Optionally add a reranking step on the top N chunks using an LLM or cross-encoder.

5. Prompt Engineering

- Create a base system prompt for query answering that:
- Emphasizes honesty, non-hallucination, and citing the video via timestamps.
- Explains how to behave differently in `video_strict` vs `video_plus_general` modes.
- Create a separate system prompt for the answerability classifier that:
- Instructs the LLM to label relevance and sufficiency of context.
- Requires a simple, explicit JSON output for easy parsing.

6. Edge Case Handling

- If Pinecone returns no vectors at all for a video ID, immediately return a specific error or fallback message.
- If the transcript is very short (e.g., under a few thousand characters), skip chunking and send the full transcript directly to the model.
- Log query, top similarity scores, and answerability outputs to refine thresholds over time.

7. Documentation & UX

- Update the README and internal docs to describe the new modes and behaviors.
- In the UI, clearly signal when:
- The answer is strictly from the video.
- The answer includes both video-based content and general knowledge.
- The video does not cover the user’s topic.

### Suggested Todos

- `define-modes`: Define `video_strict` and `video_plus_general` modes for the query API and UI.
- `add-answerability-step`: Implement the LLM-based answerability / relevance check after retrieval.
- `tune-retrieval`: Adjust k and similarity handling to remove brittle hard thresholds.
- `design-prompts`: Write concrete system and classifier prompts for the three main cases.
- `handle-edge-cases`: Add logic for very short transcripts, no-vectors, and logging for future tuning.

### To-dos

- [ ] Define and plumb `video_strict` vs `video_plus_general` answering modes through the query API and UI toggle.
- [ ] Add an LLM-based answerability/relevance classification step after Pinecone retrieval to detect off-topic and shallow-context cases.
- [ ] Tune Pinecone retrieval parameters: choose k by video length, remove brittle hard scoreThreshold, and optionally add reranking.
- [ ] Create system prompts for (a) answering with/without general knowledge and (b) the answerability classifier returning JSON.
- [ ] Implement handling for very short transcripts, missing vectors, and logging of similarity scores and classifier outputs.
