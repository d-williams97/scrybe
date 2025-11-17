<!-- e23a50fb-f42a-49d1-ae28-5f825800f0c5 31481264-8057-469a-b93e-5f8e1de4ba35 -->
# RAG System Improvements Plan

## Problem Analysis & Solutions

### Problem 1: Score Threshold Filtering

**Current Issue**: Fixed `scoreThreshold: 0.5` returned no results for most queries.

**Recommended Solution**: Adaptive Score Threshold with Fallback Strategy

**Approach**:

1. Use dynamic threshold based on retrieval results
2. Implement multi-tier retrieval strategy
3. Add relevance scoring and filtering

**Flow**:

```
Query → Retrieve k chunks → Check scores
├─ If max score > 0.7 → Use strict filter (0.6)
├─ If max score 0.5-0.7 → Use moderate filter (0.4)
├─ If max score < 0.5 → Use lenient filter (0.3) OR expand k
└─ If no chunks pass → Return "insufficient context" message
```

**Implementation**:

- Calculate score distribution from initial retrieval
- Apply adaptive threshold based on score percentiles
- Fallback to lower k with relaxed threshold if needed

**Pros**:

- Adapts to query-video similarity automatically
- Reduces false negatives
- Maintains quality filtering

**Cons**:

- More complex logic
- Requires tuning thresholds per use case

---

### Problem 2: Vague Responses for Shallow Context

**Current Issue**: Videos briefly mention topics, retrieved chunks lack depth, LLM gives vague answers.

**Recommended Solution**: Hybrid Context Expansion with User Control

**Approach**: Option C (Hybrid) - Provide video-specific info first, then optionally expand

**Flow**:

```
Retrieve chunks → Analyze context depth → Generate response
├─ If context is comprehensive → Strict RAG (video-only)
├─ If context is shallow → Hybrid response:
│   ├─ Part 1: What the video says (with timestamps)
│   ├─ Part 2: Additional context (clearly marked as "general knowledge")
│   └─ Part 3: Note about video limitations
└─ If context is minimal → Ask user if they want expansion
```

**Implementation**:

- Add context depth analysis (chunk count, coverage, keyword density)
- Two-stage prompt: first video context, then expansion decision
- Clear labeling of video vs. general knowledge

**Pros**:

- Maintains RAG integrity for video-specific content
- Provides value when video is shallow
- Transparent about information sources

**Cons**:

- More complex prompt engineering
- Potential for confusion if not clearly labeled

---

### Problem 3: Irrelevant Query Handling

**Current Issue**: No clear strategy when queries don't match video content.

**Recommended Solution**: Multi-Level Relevance Detection

**Approach**:

1. Pre-retrieval relevance check
2. Post-retrieval relevance scoring
3. Clear user messaging

**Flow**:

```
Query → Pre-check (optional) → Retrieve chunks → Score relevance
├─ If max score < 0.3 → "No relevant information found"
├─ If max score 0.3-0.5 → "Limited information available" + show what exists
├─ If max score > 0.5 → Normal processing
└─ If chunks empty → "Video doesn't cover this topic"
```

**Implementation**:

- Add relevance threshold checks
- Return structured responses with confidence levels
- Provide alternative suggestions when possible

**Pros**:

- Clear user communication
- Prevents hallucination
- Better UX

**Cons**:

- Requires threshold tuning
- May need to handle edge cases

---

## Implementation Details

### File Changes

**`src/app/api/youtubeQuery/route.ts`**:

- Add adaptive score threshold logic
- Implement context depth analysis
- Add relevance scoring and filtering
- Enhance prompt with hybrid expansion capability
- Add structured response format

**Key Functions to Add**:

1. `calculateAdaptiveThreshold(chunks, scores)` - Dynamic threshold calculation
2. `analyzeContextDepth(chunks)` - Assess if context is shallow
3. `scoreRelevance(chunks, query)` - Calculate relevance scores
4. `buildHybridPrompt(context, query, depth)` - Enhanced prompt builder

### Parameters to Adjust

**Retrieval**:

- `k`: Current 5-10 based on complexity (keep)
- `scoreThreshold`: Adaptive 0.3-0.6 based on score distribution
- `minScore`: 0.3 for relevance filtering

**LLM**:

- `temperature`: 0.3-0.5 (lower for strict RAG, higher for expansion)
- Add `max_tokens` limit for structured responses

**Chunking** (consider for future):

- Current: 1000 chars, 120 overlap (good)
- Could experiment with semantic chunking for better context

### Prompt Engineering

**Enhanced System Prompt Structure**:

```
You are a helpful assistant answering questions about a YouTube video transcript.

CONTEXT ANALYSIS:
- Video-specific information: [chunks with timestamps]
- Context depth: [shallow/moderate/comprehensive]
- Relevance score: [0-1]

RESPONSE STRATEGY:
1. If context is comprehensive: Answer strictly from video content
2. If context is shallow:
   a. First: Summarize what the video says about this topic
   b. Then: [If user wants expansion] Provide additional context (clearly marked)
   c. Note: Indicate when information goes beyond the video

3. If query is irrelevant: Clearly state the video doesn't cover this topic

RULES:
- Always cite timestamps when available
- Never hallucinate information
- Clearly distinguish video content from general knowledge
- If insufficient information, say so explicitly
```

---

## Testing Strategy

1. **Score Threshold**: Test with various query types (specific, vague, off-topic)
2. **Shallow Context**: Test with short videos (< 5 min) on complex topics
3. **Irrelevant Queries**: Test queries completely unrelated to video content

## Edge Cases to Handle

1. Empty retrieval results
2. All chunks below threshold
3. Query matches video title but not content
4. Very short videos (< 2 min)
5. Non-English queries/content
6. Technical queries requiring domain knowledge

---

## Future Enhancements (Out of Scope)

1. Query rewriting/expansion before retrieval
2. Multi-hop retrieval for complex queries
3. Semantic chunking instead of character-based
4. User feedback loop for relevance tuning
5. Caching frequently asked queries

### To-dos

- [ ] Implement adaptive score threshold logic that adjusts based on retrieval score distribution
- [ ] Add relevance scoring function to evaluate chunk-query match quality
- [ ] Create function to analyze context depth (shallow/moderate/comprehensive) from retrieved chunks
- [ ] Build enhanced prompt system that supports hybrid responses (video + expansion) with clear labeling
- [ ] Update response format to include relevance scores, context depth, and structured answer sections
- [ ] Implement multi-level relevance detection with clear user messaging for off-topic queries
- [ ] Replace current error handling with structured responses for no-results scenarios