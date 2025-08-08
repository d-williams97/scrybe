# User Interface Description: Scribe

## Layout Structure

### Overall Layout

- Minimalist, single-page, top-to-bottom vertical layout with generous white space
- Content presented in a single, centered column with constrained maximum width for readability
- Document page-like appearance

### Header

- Fixed, minimal header containing only the Scribe logo on the left

### Main Content Area

- Single, focused column containing all core components in logical, linear sequence

## Core Components

### Input Section

- Prominent H1 title (e.g., "AI-Generated Notes for Video & Audio")
- Brief subtitle (e.g., "Paste a YouTube URL or drop a file to get started")
- URL Input: Simple text input field with placeholder text
- File Input: Large, clearly defined drag-and-drop zone that doubles as file picker button, listing supported file types

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

- Primary, full-width button labeled "Summarize"
- Main call-to-action on the page

### Feedback & Output Section

- Hidden by default, appears after initiating summarization
- Progress Indicator: Clean, horizontal progress bar for real-time feedback
- Editor: Large, simple textarea for editing generated notes
- Download Button: Secondary button labeled "Download .txt" below editor

## Interaction Patterns

### Workflow

Sequential, single-page experience: Input -> Configure -> Summarize -> View/Edit -> Export

### State Changes

- "Summarize" button shows loading state (spinner) after click
- Output area appears dynamically below controls, no page refresh
- Timestamps rendered as standard blue hyperlinks

## Visual Design Elements & Color Scheme

### Inspiration

Supadata.ai - minimalist, high-contrast, and text-focused

### Color Palette

- Background: Off-white or very light grey
- Text: Near-black for high readability
- Primary Accent: Single, professional color (e.g., blue) for primary actions and active states
- Borders: Subtle, light grey for input fields and dividers
- Icons: Minimalist, line-art style

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
