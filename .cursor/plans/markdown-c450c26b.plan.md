<!-- c450c26b-c8c0-4659-99d2-d27842475483 8071b869-f39a-46f1-b377-8a8d48255bf6 -->
# Clickable Timestamps Implementation

## Goal

Make timestamps (e.g., `[04:23]`) in Markdown output clickable. Clicking a timestamp should seek the embedded YouTube video to that specific time.

## Steps

### 1. Install Dependencies

- Install `react-youtube` for programmatic control over the YouTube player.
- Install `@types/react-youtube` for TypeScript support.

### 2. Update MarkdownRenderer Component

- Modify `src/components/MarkdownRenderer.tsx` to:
- Accept an `onTimestampClick` callback prop.
- Pre-process content to convert `[mm:ss]` patterns into internal links (e.g., `[04:23](#timestamp-263)`).
- Use a custom `a` tag component in `react-markdown` to intercept these specific links.
- Render them as blue, clickable buttons that trigger `onTimestampClick`.

### 3. Update Page Component

- Modify `src/app/page.tsx`:
- Import `YouTube` from `react-youtube`.
- Add state/ref to hold the YouTube player instance.
- Create `handleTimestampClick` function to seek the video.
- Replace the existing `<iframe>` with the `YouTube` component.
- Pass `handleTimestampClick` to both `MarkdownRenderer` instances (summary and query answers).

## Technical Details

- **Regex Pattern**: `\[(\d{1,2}):(\d{2})\]` to match `[mm:ss]`.
- **Link Styling**: `text-blue-500 hover:text-blue-400 hover:underline cursor-pointer` (Blue as requested).
- **Player Config**: Ensure `react-youtube` uses the same dimensions and responsive container as the previous iframe.

## Verification

- Generate a summary with timestamps.
- Click a timestamp -> Video should jump to that time.
- Ask a question -> Click a timestamp in the answer -> Video should jump.

### To-dos

- [ ] Install react-markdown, remark-gfm, and @tailwindcss/typography
- [ ] Configure Tailwind typography plugin in globals.css
- [ ] Update LLM prompts to request Markdown output in both API routes
- [ ] Create MarkdownRenderer component with custom styling
- [ ] Replace Textarea with MarkdownRenderer and add edit/preview toggle
- [ ] Update query answer bubbles to use MarkdownRenderer
- [ ] Fix queryVideo() to handle both JSON and stream responses
- [ ] Install react-youtube and types
- [ ] Update MarkdownRenderer.tsx to handle timestamp links
- [ ] Update page.tsx to replace iframe with YouTube player and add seek logic