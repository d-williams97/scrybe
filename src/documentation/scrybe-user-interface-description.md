# User Interface Description: Scribe

## Layout Structure

### Overall Layout

- Minimalist, single-page, top-to-bottom vertical layout with generous white space
- Content presented in a single, centered column with constrained maximum width for readability
- Document page-like appearance

### Header

- Fixed, minimal header containing only the Scribe logo on the left (top-left)

### Main Content Area

- Single, focused column containing all core components in logical, linear sequence

## Core Components

### Landing Page Sketch

+-----------------------------------------------------------------------+
| top-left: [ Scribe logo ] |
|-----------------------------------------------------------------------|
| |
| from videos to notes in seconds |
| |
| [ youtube ] [ upload ] |
| (youtube is default) |
|-----------------------------------------------------------------------|
| IF youtube selected: [ Paste YouTube link here ................ ] |
| IF upload selected: [ Upload or drag a file here ............. ] |
|-----------------------------------------------------------------------|
| Options: Summary depth | Style | Include timestamps |
|-----------------------------------------------------------------------|
| [ Summarize ▶ ] |
| [ Progress bar 0–100 % ▓▓▓░░ ] (shows after click) |
|-----------------------------------------------------------------------|
| After processing: Transcript/Summary editor + [ Download .txt ] |
+-----------------------------------------------------------------------+

### Input Section

- Hero H1 text: "from videos to notes in seconds"
- Input Mode Toggle (centered, two small buttons): `youtube` (default) and `upload`
- When `youtube` is selected: Large URL text input to paste the link
- When `upload` is selected: Large drag-and-drop zone that also acts as a file picker; supports `.mp4`, `.mov`, `.webm`, `.mp3`, `.wav`

### Options Panel

- Simple, uncluttered configuration section
- Summary Depth: Two radio buttons or toggle switch labeled "Brief" and "In-depth"
- Summary Style: Row of styled, clickable buttons for each style:
  - Academic
  - Casual
  - Bullet Points
  - Revision Notes
  - Paragraph
- Timestamps: Single checkbox labeled "Include clickable timestamps"

### Action Button

- Primary, prominent button labeled "Summarize"
- Main call-to-action on the page

### Feedback & Output Section

- Hidden by default; appears after initiating summarization
- Progress Indicator: Clean horizontal progress bar shown under the button once processing begins
- Editor: Large, simple textarea or rich-text editor for editing generated notes
- Download Button: Secondary button labeled "Download .txt" below or beside the editor

## Interaction Patterns

### Workflow

Sequential, single-page experience: Input -> Configure -> Summarize -> View/Edit -> Export

### State Changes

- "Summarize" button shows loading state (spinner) after click
- Output area appears dynamically below controls, no page refresh
- Timestamps rendered as standard blue hyperlinks

## Visual Design Elements & Color Scheme

### Color Palette

- Minimalist, mostly monochrome theme inspired by the aesthetic of [Supadata](https://supadata.ai/)
- Background: Off-white or very light grey (Light) / Near-black (Dark)
- Text: Near-black (Light) / Near-white (Dark) for high readability
- Primary Accent: Single, professional accent color (subtle blue) for primary actions and active states
- Borders: Subtle, low-contrast separators for inputs and sections
- Icons: Minimalist, line-art style

### Themes

- Light and Dark modes with a single-source color system and accessible contrast

## Mobile, Web App, Desktop Considerations

### Web App (Default)

- Centered, constrained-width layout ideal for desktop browsers

### Mobile Responsiveness

- Single vertical column layout
- Drag-and-drop zone becomes simple "Upload File" button
- Increased touch targets and font sizes

### Desktop

- Spacious and focused design
- Comfortable reading and interaction environment through margin use

## Typography

- Typewriter-like display for hero and headings, minimalist, high-contrast, and text-focused (inspired by [Supadata](https://supadata.ai/))

### Headings & UI

- Clean, highly legible sans-serif font (e.g., Inter, Manrope)
- Used for all titles, labels, and buttons

### Editor Body

- Monospaced font (e.g., Roboto Mono, Source Code Pro)
- Enhances "typewriter" feel
- Aligns with developer-tool aesthetic

## Accessibility

### Standards & Features

- Color Contrast: WCAG AA compliant text/background combinations
- Keyboard Navigation: Full keyboard operability with visible focus indicators
- ARIA Roles: Proper attributes for dynamic components (e.g., progress bar)
- Labels: Explicitly associated labels for all form controls
