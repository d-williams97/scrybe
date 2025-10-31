<!-- d799684f-3ffc-49ba-8d52-6930b7959be6 b020e833-a3f0-47f1-bdfd-7ff621aec2a6 -->
# RAG Integration with LangChain for YouTube Summarization

## Executive Summary

Your plan is **feasible and well-structured**. The two-phase approach (improved summarization → queryable summaries) is sound. However, there are some refinements needed for Next.js 15 + Vercel deployment.

### Key Refinements to Your Original Plan:

1. **Vector Store Choice**: Pinecone is excellent for Vercel/serverless - it's cloud-hosted, Node.js compatible, and handles cold starts well
2. **Embedding Strategy**: For cost efficiency, we'll embed chunks once and reuse them for both summarization and queries
3. **Serverless Considerations**: Break the flow into separate API routes to avoid Vercel's 10-second timeout on Hobby plan (60s on Pro)
4. **Session Management**: Store vector store namespace/IDs to enable post-summary queries without re-embedding

---

## Technical Architecture

### Phase 1: RAG-Enhanced Summarization

**Current Flow:**

```
YouTube URL → Fetch Transcript → Chunk → Summarize Each → Merge Summary
```

**New RAG Flow:**

```
YouTube URL → Fetch Transcript → Chunk → Embed & Store in Pinecone → 
Retrieve Top-K Relevant Chunks → Summarize Retrieved Chunks → Generate Final Summary
```

### Phase 2: Queryable Summaries (Future)

**Flow:**

```
User Query → Embed Query → Retrieve Relevant Chunks from Pinecone → 
Generate Answer via LLM
```

---

## Implementation Steps

### 1. Install Dependencies

Add to `package.json`:

```json
{
  "@langchain/core": "latest",
  "@langchain/openai": "latest", 
  "@langchain/textsplitters": "latest",
  "@langchain/pinecone": "latest",
  "@pinecone-database/pinecone": "latest",
  "@langchain/langgraph": "latest"
}
```

### 2. Environment Setup

Add to `.env.local`:

```
OPENAI_API_KEY=your-existing-key
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX_NAME=scrybe-transcripts
```

### 3. Create Pinecone Initialization Helper

**New file:** `src/lib/pinecone.ts`

Initialize Pinecone client with proper configuration for serverless environments. Export reusable functions for:

- Getting/creating index
- Generating namespace from video ID (to isolate transcripts)
- Connection pooling for Vercel edge functions

### 4. Create LangChain RAG Service

**New file:** `src/lib/ragService.ts`

Core RAG logic with functions:

- `embedAndStoreChunks()`: Split transcript, create embeddings via `OpenAIEmbeddings`, store in Pinecone with metadata (timestamps, position)
- `retrieveRelevantChunks()`: Query vector store based on user's summary preferences (depth, style) to retrieve most relevant chunks
- `generateSummaryFromChunks()`: Feed retrieved chunks to OpenAI via LangChain prompt templates

**Key Decision - Balanced Approach:**

- Chunk size: 1000 characters, 200 overlap (standard RAG practice)
- Embed model: `text-embedding-3-small` (cheaper, 1536 dimensions)
- Retrieval: Top 10-15 chunks for brief summaries, 20-30 for in-depth
- Use semantic search only (no hybrid/reranking to control costs)

### 5. Update YouTube Summary API Route

**File:** `src/app/api/youtubeSummary/route.ts`

**Changes:**

a) **Remove direct OpenAI client usage** - replace with LangChain components

b) **New flow:**

```typescript
1. Fetch transcript (existing code)
2. Create namespace: `youtube-${videoId}`
3. Call ragService.embedAndStoreChunks(transcript, namespace)
4. Build retrieval query from user preferences:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           - "Summarize main points about [videoTitle]" for brief
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           - "Extract detailed information about [videoTitle]" for in-depth
5. Call ragService.retrieveRelevantChunks(query, namespace, numChunks)
6. Call ragService.generateSummaryFromChunks(chunks, depth, style, timestamps)
7. Return summary + namespace ID (store in state for future queries)
```

c) **Handle timeouts:**

- If video is very long (>30 min), return `jobId` immediately
- Process embedding/summarization in background
- Client polls `/api/jobs?jobId=...` for status
- Uncomment and adapt existing polling code in `page.tsx`

### 6. Update Types

**File:** `src/app/types.ts`

Add:

```typescript
export interface RAGMetadata {
  namespace: string; // Pinecone namespace for this video
  videoId: string;
  videoTitle: string;
  chunkCount: number;
}

export interface SummaryResponse {
  summary: string;
  metadata: RAGMetadata; // Enable future queries
}
```

### 7. Update Frontend State

**File:** `src/app/page.tsx`

- Store `ragMetadata` in state after successful summary
- Update response handling to extract `metadata` from API response
- Prepare state structure for Phase 2 chat interface (add `chatMessages` state, but don't render yet)

### 8. Create Job Manager (If Needed)

**File:** `src/lib/jobManager.ts`

Already exists but commented out. If videos are long:

- Implement in-memory job queue (use Map or Redis if available)
- Track status: `embedding → retrieving → summarizing → ready`
- Update progress: 0-30% embedding, 30-60% retrieval, 60-100% generation

**Alternative:** Use Vercel KV or Upstash Redis for persistent job storage across serverless invocations

### 9. Prompt Engineering

Create optimized prompts in `src/lib/prompts.ts`:

**Retrieval Query Prompt:**

```
Based on style={style} and depth={depth}, generate search query for transcript chunks
```

**Summary Generation Prompt:**

```
You are an expert note-taker. Create a {depth} summary in {style} format.
Context chunks provided below. Video: {title}.
Constraints: {wordCount}, British English, {timestamps ? 'include [mm:ss]' : 'no timestamps'}
```

### 10. Error Handling & Edge Cases

- **Pinecone quota exceeded**: Graceful fallback to original summarization method
- **No transcript available**: Return proper 404 error
- **Video too long**: Split into smaller namespace chunks or return job ID
- **Cold start timeouts**: Implement retry logic with exponential backoff

### 11. Testing Strategy

- Test with short video (<5 min): Ensure embeddings work
- Test with medium video (10-15 min): Verify chunk retrieval quality
- Test with long video (30+ min): Confirm timeout handling
- Test different summary styles: Validate prompt templates produce correct formats

### 12. Deployment Preparation

**Vercel Configuration:**

- Set max duration in `next.config.ts` (60s for Pro plan):
```typescript
export const config = {
  maxDuration: 60,
};
```

- Add environment variables in Vercel dashboard
- Ensure Pinecone index is created before deployment (use free tier: 1 index, 100K vectors)

---

## Phase 2 Preview: Queryable Summaries

**Future Implementation** (not in current plan):

1. Add chat UI component below summary (collapsible section)
2. Create `/api/query` route:

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Accept: `{ question, namespace }`
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Retrieve chunks from existing Pinecone namespace
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Generate answer via LangChain QA chain

3. Display answers with sources/timestamps

**File:** `src/components/ChatInterface.tsx` (to be created later)

---

## Cost Estimates (Balanced Approach)

**Per 30-minute video (~45,000 words transcript):**

- Chunking: Free
- Embeddings (45 chunks × $0.00002/1K tokens): ~$0.002
- Pinecone storage: Free tier (100K vectors)
- Summary generation (2-3 API calls): ~$0.01
- **Total: ~$0.012 per video**

**For queryable summaries (Phase 2):**

- Query embedding: $0.00002
- Answer generation: $0.005-0.01
- **Total: ~$0.01 per query**

---

## Key Files to Modify/Create

**New Files:**

- `src/lib/pinecone.ts` - Pinecone client initialization
- `src/lib/ragService.ts` - Core RAG logic with LangChain
- `src/lib/prompts.ts` - Prompt templates
- `.env.local` - Environment variables

**Modified Files:**

- `src/app/api/youtubeSummary/route.ts` - Replace direct OpenAI with RAG flow
- `src/app/types.ts` - Add RAG metadata types
- `src/app/page.tsx` - Store metadata, prepare for chat UI
- `package.json` - Add LangChain + Pinecone dependencies
- `next.config.ts` - Add maxDuration config

**Potentially Modified:**

- `src/lib/jobManager.ts` - Enable background processing for long videos

---

## Success Criteria

✅ Embeddings stored in Pinecone after transcript fetch

✅ Summaries generated from retrieved chunks (not sequential processing)

✅ Summary quality improved for long videos

✅ Namespace IDs returned to enable future queries

✅ Deployment successful on Vercel with no timeouts

✅ Cost per summary < $0.02

---

## Risks & Mitigations

| Risk | Mitigation |

|------|-----------|

| Vercel timeout on long videos | Implement job queue with polling |

| Pinecone cold start latency | Use connection pooling, cache client |

| Poor chunk retrieval | Tune chunk size/overlap, test with various videos |

| OpenAI rate limits | Add retry logic with exponential backoff |

| Cost overruns | Monitor usage, set budgets in OpenAI dashboard |

---

## Next Steps After Implementation

1. A/B test: RAG summary vs. original sequential summary
2. Collect user feedback on summary quality
3. Implement Phase 2: Chat interface for queries
4. Add analytics: Track embedding count, retrieval accuracy
5. Optimize: Experiment with hybrid search, reranking for Pro users

### To-dos

- [ ] Install LangChain packages (@langchain/core, @langchain/openai, @langchain/textsplitters, @langchain/pinecone) and Pinecone SDK
- [ ] Add Pinecone API key and index name to environment variables (.env.local)
- [ ] Create src/lib/pinecone.ts with Pinecone client initialization and namespace utilities
- [ ] Create src/lib/ragService.ts with embedAndStoreChunks, retrieveRelevantChunks, and generateSummaryFromChunks functions
- [ ] Create src/lib/prompts.ts with LangChain prompt templates for retrieval queries and summary generation
- [ ] Add RAGMetadata and SummaryResponse types to src/app/types.ts
- [ ] Update src/app/api/youtubeSummary/route.ts to use RAG service instead of direct OpenAI calls
- [ ] Update src/app/page.tsx to store and handle RAG metadata from API responses
- [ ] Implement job queue logic in src/lib/jobManager.ts for long videos, or add timeout handling in API route
- [ ] Add maxDuration configuration to next.config.ts for Vercel deployment
- [ ] Test with short, medium, and long videos to verify embedding, retrieval, and summary generation
- [ ] Deploy to Vercel with environment variables configured and verify production functionality