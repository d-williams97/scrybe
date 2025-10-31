<!-- 05b1bda9-20af-468f-b95f-b36db0d07b7f a9bb7997-2f09-44b9-b836-dbf55d4ffb8f -->
# RAG Integration with LangChain for Scrybe

## Summary

This plan integrates Retrieval-Augmented Generation (RAG) using LangChain into the existing YouTube summarization pipeline. The implementation will:

1. **Improved Summarization**: Enhance the existing sequential chunk summarization with semantic retrieval to identify and summarize only the most relevant chunks, reducing information loss in long videos. The existing flow will remain as a fallback option.

2. **Queryable Summaries**: After summary generation, enable users to ask questions about the video content using RAG retrieval from the stored vector embeddings, **scoped per video** using Pinecone metadata filtering.

**Key Components**:

- LangChain for orchestration
- OpenAI Embeddings (text-embedding-3-small or text-embedding-ada-002)
- **Pinecone** vector store (cloud-based, Node.js compatible, managed service)
- Per-video query scoping using YouTube videoId as metadata filter in Pinecone

## Implementation Plan

### Phase 1: Setup Dependencies & Configuration

1. **Install required packages**

   - `langchain` - Core LangChain framework
   - `@langchain/openai` - OpenAI integrations (embeddings & LLM)
   - `@pinecone-database/pinecone` - Pinecone client SDK
   - `@langchain/pinecone` - LangChain Pinecone integration
   - `@langchain/textsplitters` - Text splitting utilities

2. **Environment variables**

   - Add `PINECONE_API_KEY` to `.env.local`
   - Add `PINECONE_INDEX_NAME` (e.g., `scrybe-transcripts`)
   - Ensure `OPENAI_API_KEY` is set (already exists)

3. **Create vector store utility**

   - File: `src/lib/vectorStore.ts`
   - Initialize Pinecone client
   - Create helper functions for index management
   - Handle videoId-based metadata filtering
   - Export functions: `initializePinecone()`, `getVectorStore(videoId)`, `addChunks(videoId, chunks)`

### Phase 2: Refactor Summarization Pipeline

4. **Update transcript processing**

   - File: `src/app/api/youtubeSummary/route.ts`
   - Extract videoId from URL using `ytdl-core` (already available via `videoInfo.videoDetails.videoId`)
   - Replace character-limit chunking with LangChain's `RecursiveCharacterTextSplitter`
   - Create chunks with metadata:
     - `videoId`: YouTube video ID (for filtering)
     - `chunkIndex`: Position in transcript
     - `text`: Original chunk text
     - `timestamp`: Start time if available (from transcript segments)

5. **Implement embedding and storage**

   - After transcript chunking, embed all chunks using `OpenAIEmbeddings`
   - Store embeddings in Pinecone with metadata:
     - `videoId`: YouTube video ID (critical for per-video scoping)
     - `chunkIndex`: Position in transcript
     - `text`: Original chunk text (for retrieval)
     - `timestamp`: Start time if available
   - Use Pinecone's `upsert` API with batch processing for efficiency

6. **Implement RAG-based summarization**

   - Enhance existing summarization with RAG (keep existing flow as fallback):
     - Use LangChain's `RetrievalQA` or custom retrieval chain
     - Create a query from user preferences (depth, style) to retrieve relevant chunks
     - Use Pinecone metadata filter: `{ videoId: { $eq: videoId } }` to scope retrieval
     - Example: For "brief" summary, retrieve top 5-8 most important chunks
     - For "in-depth", retrieve top 12-15 chunks
   - Feed retrieved chunks to LLM for summarization with existing prompt logic
   - Return both summary and videoId (for later querying)

### Phase 3: Create Query Endpoint

7. **Create query API route**

   - File: `src/app/api/query/route.ts`
   - Accept POST request with:
     - `videoId`: YouTube video ID (required for scoping)
     - `query`: User's question
   - **Critical**: Retrieve relevant chunks from Pinecone using metadata filter:
     ```typescript
     filter: { videoId: { $eq: videoId } }
     ```

   - This ensures queries are scoped to the specific video only
   - Use LangChain QA chain (RAG pattern) to generate answer from retrieved context
   - Return answer with optional source chunks/references
   - Validate videoId exists in vector store before querying

8. **Update types**

   - File: `src/app/types.ts`
   - Add `QueryRequest` interface: `{ videoId: string; query: string }`
   - Add `QueryResponse` interface: `{ answer: string; sources?: Array<{ text: string; chunkIndex: number }> }`
   - Add `videoId` to summary response type

### Phase 4: Update Frontend

9. **Update summary response handling**

   - File: `src/app/page.tsx`
   - After successful summary generation, store `videoId` in state
   - Update `handleSummarize` to extract and store videoId from response
   - Display videoId or video title for reference

10. **Add query interface**

    - File: `src/app/page.tsx`
    - Add query input field (shown after summary is generated)
    - Add query submission handler that includes videoId
    - Display query results below summary
    - Show loading state during query
    - Handle errors gracefully (e.g., videoId not found)

### Phase 5: Integration & Error Handling

11. **Error handling**

    - Handle Pinecone connection errors gracefully
    - Handle missing embeddings/vector store errors
    - Fallback to existing summarization if RAG fails (optional)
    - Validate videoId format before querying
    - Return clear error messages for missing videoId in vector store

12. **Cleanup & optimization**

    - Remove test error throw in `route.ts` (line 183)
    - Add proper error messages
    - Optimize chunk size and overlap for better retrieval
    - Consider batch embedding for better performance
    - Add logging for debugging Pinecone operations

## Technical Details

### Chunking Strategy

- Use `RecursiveCharacterTextSplitter` with:
  - Chunk size: ~1000 characters (allows semantic meaning preservation)
  - Overlap: ~200 characters (maintains context across chunks)
  - Split by sentences/paragraphs for better semantic boundaries

### Retrieval Strategy

- For summarization: Use a query like "What are the main points and key information in this video?" to retrieve top-k chunks
- For user queries: Use the user's question directly for semantic search
- Top-k retrieval: 5-8 for brief, 12-15 for in-depth summaries
- **Always filter by videoId** in Pinecone queries to ensure per-video scoping

### Pinecone Setup

- Index name: `scrybe-transcripts` (configurable via `PINECONE_INDEX_NAME` env var)
- Dimension: 1536 (for OpenAI text-embedding-3-small) or 3072 (for text-embedding-ada-002)
- Metric: `cosine`
- **Per-video query scoping**: Use Pinecone metadata filtering with `videoId` field
  - All queries must include filter: `{ videoId: { $eq: "YOUTUBE_VIDEO_ID" } }`
  - Ensures queries only retrieve chunks from the specific video being queried
  - Prevents cross-video contamination
  - Example filter usage:
    ```typescript
    const filter = { videoId: { $eq: videoId } };
    ```


### LangChain Chains

- Summarization: Use LangChain's RAG pattern (as per official tutorial):
  - `PineconeVectorStore` (via `@langchain/pinecone`) with metadata filter by videoId
  - `VectorStoreRetriever` with similarity search and filter
  - `ChatOpenAI` model
  - Custom prompt template (adapt existing `buildFinalPrompt`)
  - Retrieve top-k chunks based on depth preference
- Querying: Similar RAG pattern:
  - Same `PineconeVectorStore` with videoId filter
  - Use LangChain's RAG prompt template (from `langchain/hub` or custom)
  - `ChatOpenAI` model
  - User's question as the retrieval query
  - Always scope retrieval with videoId filter

## Files to Modify

1. `package.json` - Add dependencies
2. `src/app/api/youtubeSummary/route.ts` - Add RAG-enhanced summarization (keep existing flow)
3. `src/app/types.ts` - Add query-related types and videoId to responses
4. `src/app/page.tsx` - Add query UI and handlers, store videoId
5. `.env.local` - Add Pinecone credentials

## Files to Create

1. `src/lib/vectorStore.ts` - Vector store initialization and helpers
2. `src/app/api/query/route.ts` - Query endpoint for user questions (scoped per video)
3. `.env.example` - Document required environment variables

## Dependencies to Add

```json
{
  "langchain": "^0.3.0",
  "@langchain/openai": "^0.3.0",
  "@langchain/textsplitters": "^0.3.0",
  "@pinecone-database/pinecone": "^1.1.0",
  "@langchain/pinecone": "^0.3.0"
}
```

Note: `@langchain/pinecone` provides LangChain integration for Pinecone vector stores.

## Testing Considerations

- Test with short videos (< 5 min) first
- Test with long videos (> 20 min) to verify RAG benefits
- **Verify Pinecone metadata filtering works correctly** - ensure queries only return chunks from the queried video
- Test query endpoint with various question types
- Test query endpoint with invalid/missing videoId
- Verify no cross-video contamination in retrieval results
- Test fallback behavior if vector store is unavailable