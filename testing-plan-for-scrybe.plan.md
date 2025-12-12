<!-- 783b3cbd-64cf-4bcd-9298-9ade710989be 8b88cce8-ca1a-4c23-b93d-89b1e908dc11 -->
# Testing Plan for Scrybe

## Overview

Set up Jest and React Testing Library to test components, utility functions, and API route logic. The codebase has several testable areas including React components, helper functions, and API route handlers.

## Test Structure

### 1. Setup and Configuration

- Create `jest.config.js` with Next.js and TypeScript support
- Configure test environment (jsdom) and module path aliases (`@/*`)
- Set up test utilities and mocks for Next.js Image, YouTube player, and streaming responses
- Create `__tests__` directories or co-locate tests with `.test.tsx`/`.test.ts` files

### 2. Component Tests (sorted by difficulty: easiest to hardest)

#### `MarkdownRenderer` Component (`src/components/MarkdownRenderer.tsx`) - **Medium Difficulty**

- **Rendering tests:**
- Renders markdown content correctly
- Applies custom className prop
- Handles empty content gracefully
- **Timestamp functionality:**
- Converts `(mm:ss)` timestamps to clickable links
- Calls `onTimestampClick` callback with correct seconds when timestamp is clicked
- Handles multiple timestamps in content
- Handles edge cases (invalid timestamps, missing callback)
- **Link handling:**
- Renders regular markdown links correctly
- Distinguishes between timestamp links and regular links
- Applies correct styling to timestamp buttons

#### Main Page Component (`src/app/page.tsx`) - **Hard Difficulty**

- **State management:**
- Initial state values are correct
- State updates correctly on user input
- **Form interactions:**
- YouTube URL input updates state
- Summary depth selection works
- Style selection works
- Timestamp checkbox toggles correctly
- **Download functionality:**
- `downloadNotes` function creates correct file formats (TXT, MD, PDF)
- PDF generation handles word wrapping correctly
- Downloads trigger correctly with proper filenames
- Handles empty notes gracefully
- **YouTube player integration:**
- `handleTimestampClick` seeks to correct time
- Player ref is stored correctly
- Scroll behavior works when timestamp is clicked
- **API integration (mocked):**
- `handleSummarise` calls correct API endpoint with correct payload
- Handles streaming response correctly
- Updates `generatedNotes` state incrementally
- Extracts `videoId` from stream correctly
- Handles errors gracefully
- `handleQuestionSubmit` adds query to state correctly
- `queryVideo` handles both JSON and streaming responses
- Updates query answers correctly
- Handles error responses appropriately

### 3. Utility Function Tests (sorted by difficulty: easiest to hardest)

#### `cn` function (`src/lib/utils.ts`) - **Easy Difficulty**

- Merges class names correctly using `clsx` and `twMerge`
- Handles undefined/null values
- Handles multiple class name arguments
- Resolves Tailwind class conflicts correctly

### 4. API Route Logic Tests (sorted by difficulty: easiest to hardest)

#### `youtubeSummary` route helper functions (`src/app/api/youtubeSummary/route.ts`)

- **`buildSummaryPrompt` function - Easy Difficulty:**
- Builds prompt with correct depth text
- Includes/excludes timestamps based on flag
- Includes video title correctly
- Formats style instruction correctly
- **`deepDecode` function - Easy Difficulty:**
- Decodes HTML entities correctly
- Handles double encoding
- Stops when no more decoding needed
- Handles null/undefined input

#### `youtubeQuery` route helper functions (`src/app/api/youtubeQuery/route.ts`)

- **`extractKeywords` function - Easy-Medium Difficulty:**
- Filters out stop words correctly
- Removes punctuation
- Handles empty queries
- Filters words shorter than 2 characters
- Converts to lowercase
- **`getKValue` function - Easy-Medium Difficulty:**
- Returns correct k value for high complexity queries (keywords: "explain", "analyze", etc.)
- Returns correct k value for medium complexity queries
- Returns default k value for simple queries
- Handles long queries (>20 words) correctly
- **`calculateKeywordCoverage` function - Easy-Medium Difficulty:**
- Calculates coverage ratio correctly
- Returns 0.5 for queries with no keywords
- Handles case-insensitive matching
- Returns correct ratio for partial matches
- **`evaluateContextSufficiency` function - Medium-Hard Difficulty:**
- Calls LLM with correct prompt structure
- Parses JSON response correctly
- Returns fallback on parse errors
- Handles LLM errors gracefully

#### API Route Handlers (sorted by difficulty: easiest to hardest)

- **`youtubeSummary` route handler - Hard Difficulty:**
- Validates YouTube URL using `ytdl.validateURL`
- Returns error for invalid URL
- Returns error for missing transcript
- Processes transcript correctly (decoding, normalization)
- Creates chunks with correct metadata
- Calculates timestamp ranges for chunks correctly
- Formats chunks with timestamps when flag is enabled
- Streams response correctly
- Includes videoId in stream correctly
- Handles errors gracefully
- **`youtubeQuery` route handler - Hard Difficulty:**
- Validates request body (query, videoId)
- Returns error for missing videoId
- Returns error for empty matches
- Filters chunks by score threshold correctly
- Sorts chunks by offset
- Formats context with timestamps correctly
- Returns appropriate response based on context quality (insufficient/sufficient/ambiguous)
- Handles streaming responses correctly
- Handles errors gracefully

### 5. Type Tests

#### Type definitions (`src/app/types.ts`)

- Type exports are correct
- Union types work as expected
- Interface properties match usage

## Test Files to Create

1. `src/components/__tests__/MarkdownRenderer.test.tsx`
2. `src/app/__tests__/page.test.tsx`
3. `src/lib/__tests__/utils.test.ts`
4. `src/app/api/youtubeQuery/__tests__/route.test.ts`
5. `src/app/api/youtubeSummary/__tests__/route.test.ts`
6. `jest.config.js` (root)
7. `jest.setup.js` (root) - for test environment setup

## Testing Approach

- **Unit tests:** Focus on isolated functions and components
- **Integration tests:** Test component interactions and API route handlers with mocked dependencies
- **Mocking:** Mock external dependencies (YouTube API, Pinecone, OpenAI, ytdl-core, fetch)
- **Coverage goals:** Aim for 70%+ coverage on business logic and critical paths
- **Test organization:** Group related tests using `describe` blocks
- **Test data:** Use fixtures for consistent test data (mock transcripts, API responses)

## Dependencies Needed

- `@testing-library/jest-dom` (already installed)
- `@testing-library/react` (already installed)
- `@testing-library/user-event` (may need to install for better user interaction simulation)
- Mock implementations for Next.js Image, YouTube player, and streaming APIs

### To-dos

- [ ] Create Jest configuration file (jest.config.js) with Next.js, TypeScript, and path alias support
- [ ] Create jest.setup.js for test environment configuration and global mocks
- [ ] Write tests for MarkdownRenderer component (rendering, timestamp clicks, link handling)
- [ ] Write tests for cn utility function in src/lib/utils.ts
- [ ] Write unit tests for helper functions in youtubeQuery route (getKValue, extractKeywords, calculateKeywordCoverage)
- [ ] Write unit tests for helper functions in youtubeSummary route (buildSummaryPrompt, deepDecode)
- [ ] Write integration tests for main page component (form interactions, download functionality, API calls with mocks)
- [ ] Write integration tests for API route handlers (youtubeQuery and youtubeSummary) with mocked dependencies
- [ ] Add test script to package.json for running Jest tests