<!-- ddb34ac7-e8d7-493a-b08a-8f44620fb15c 0d276b32-3560-4413-b2be-47d7cdca92d6 -->
# Stream LLM Responses with LangChain

## Overview

Enable real-time token streaming for user-facing LLM responses using LangChain's `.stream()` method, while keeping internal decision-making LLM calls as `.invoke()`.

## Implementation Details

### 1. YouTube Summary Route (`src/app/api/youtubeSummary/route.ts`)

**Current code (line 295):**

```typescript
const response = await llm.invoke(summaryPrompt);
return NextResponse.json({ summary: response.content, videoId }, { status: 201 });
```

**Updated streaming approach:**

- Replace `llm.invoke()` with `llm.stream()`
- Use `ReadableStream` with `TransformStream` to convert LangChain chunks to SSE format
- Return streaming response with proper headers

**Example implementation:**

```typescript
const stream = await llm.stream(summaryPrompt);

// Create a TransformStream to convert LangChain chunks to text
const encoder = new TextEncoder();
const readable = new ReadableStream({
  async start(controller) {
    try {
      for await (const chunk of stream) {
        const content = chunk.content;
        if (content) {
          controller.enqueue(encoder.encode(content));
        }
      }
      // Send videoId at the end as special marker
      controller.enqueue(encoder.encode(`\n__VIDEO_ID__:${videoId}`));
      controller.close();
    } catch (error) {
      controller.error(error);
    }
  }
});

return new Response(readable, {
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
  },
});
```

### 2. YouTube Query Route (`src/app/api/youtubeQuery/route.ts`)

**Lines to update:**

- Line 481: `await llm.invoke(sufficientContextQuery)` → stream
- Line 520: `await llm.invoke(sufficientContextQuery)` → stream  
- Line 544: `await llm.invoke(insufficientContextQuery)` → stream

**Keep as `.invoke()` (line 227):**

- `evaluateContextSufficiency()` function - internal logic only

**Updated streaming approach:**

```typescript
const stream = await llm.stream(sufficientContextQuery); // or insufficientContextQuery

const encoder = new TextEncoder();
const readable = new ReadableStream({
  async start(controller) {
    try {
      // Send metadata first
      const metadata = {
        contextQuality: "comprehensive",
        strategy: "strict_rag",
        metrics: { chunkCount, totalWords, avgScore, keywordCoverage, maxScore }
      };
      controller.enqueue(encoder.encode(`__METADATA__:${JSON.stringify(metadata)}\n`));
      
      // Stream answer chunks
      for await (const chunk of stream) {
        const content = chunk.content;
        if (content) {
          controller.enqueue(encoder.encode(content));
        }
      }
      controller.close();
    } catch (error) {
      controller.error(error);
    }
  }
});

return new Response(readable, {
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
  },
});
```

Apply this pattern to all three user-facing response locations (sufficient/ambiguous-sufficient/ambiguous-insufficient paths).

### 3. Frontend Updates (`src/app/page.tsx`)

**Summary fetch (line 123):**

```typescript
const res = await fetch("/api/youtubeSummary", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: youtubeUrl.trim(), depth: summaryDepth, style, includeTimestamps }),
});

if (!res.ok || !res.body) throw new Error("Failed to start job");

const reader = res.body.getReader();
const decoder = new TextDecoder();
let summary = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value, { stream: true });
  
  // Check for videoId marker
  if (chunk.includes("__VIDEO_ID__:")) {
    const [text, videoIdPart] = chunk.split("__VIDEO_ID__:");
    summary += text;
    setVideoId(videoIdPart.trim());
  } else {
    summary += chunk;
    setGeneratedNotes(summary); // Update in real-time
  }
}

setShowNotes(true);
setIsLoading(false);
```

**Query fetch (line 189):**

```typescript
const res = await fetch("/api/youtubeQuery", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query, videoId }),
});

if (!res.ok || !res.body) throw new Error("Failed to query video");

const reader = res.body.getReader();
const decoder = new TextDecoder();
let answer = "";
let metadata = null;

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value, { stream: true });
  
  // Check for metadata marker
  if (chunk.startsWith("__METADATA__:")) {
    const metadataJson = chunk.replace("__METADATA__:", "").split("\n")[0];
    metadata = JSON.parse(metadataJson);
    continue;
  }
  
  answer += chunk;
  
  // Update query answer in real-time
  setQueries((prev) => 
    prev.map((q) => q.queryId === queryId ? { ...q, answer } : q)
  );
}
```

### 4. Error Handling

Both routes need try-catch wrappers around streaming logic:

```typescript
try {
  const stream = await llm.stream(prompt);
  // ... streaming logic
} catch (error) {
  console.error("Streaming error:", error);
  return NextResponse.json({ error: "Stream failed" }, { status: 500 });
}
```

## Files to Modify

- `src/app/api/youtubeSummary/route.ts` - Line 295 (1 streaming location)
- `src/app/api/youtubeQuery/route.ts` - Lines 481, 520, 544 (3 streaming locations)
- `src/app/page.tsx` - Lines 116-152 (`handleSummarise`) and 176-210 (`queryVideo`)

## Key Benefits

- Real-time token display as LLM generates response
- Better UX with progressive content loading
- LangChain streaming API fully utilized
- Internal logic calls remain fast with `.invoke()`

### To-dos

- [ ] Update youtubeSummary route to stream LLM response with videoId marker
- [ ] Update youtubeQuery route to stream 3 LLM responses with metadata
- [ ] Update handleSummarise to process streamed summary chunks in real-time
- [ ] Update queryVideo to process streamed query answer chunks in real-time
- [ ] Test both streaming endpoints with real YouTube video