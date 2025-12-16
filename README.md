# Scrybe

**Turn YouTube videos into notes in seconds.**

Scrybe is an AI-powered tool that transcribes and summarises YouTube videos with customisable depth, style, and optional clickable timestamps. After generating notes, you can ask questions about the video content using an intelligent RAG (Retrieval-Augmented Generation) system.

## Features

- **YouTube Video Support** - Paste any YouTube URL to get started
- **AI-Powered Summarisation** - Generate structured notes using GPT-4o
- **Customisable Output**
  - Summary depth (Brief or In-depth)
  - Multiple styles (Academic, Casual, Bullet Points, Revision Notes, Paragraph)
  - Optional clickable timestamps that jump to specific moments in the video
- **Interactive Q&A** - Ask questions about the video content after summarisation
- **Multiple Export Formats** - Download notes as .txt, .md, or .pdf
- **Real-time Streaming** - Watch your notes generate in real-time
- **Embedded Player** - Review the video alongside your notes with timestamp navigation

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **AI/ML**: OpenAI (GPT-4o), LangChain, Pinecone Vector Database
- **YouTube Integration**: ytdl-core, youtube-transcript-plus
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+
- npm or equivalent package manager
- Required API keys:
  - OpenAI API key
  - Pinecone API key and index

## Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd scrybe
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the root directory with your API keys:

```env
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_pinecone_index_name
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Paste a YouTube URL** into the input field
2. **Configure your preferences**:
   - Choose summary depth (Brief or In-depth)
   - Select your preferred style
   - Toggle timestamps on/off
3. **Click "Summarise"** and watch your notes generate in real-time
4. **Ask questions** about the video content using the Q&A interface
5. **Download** your notes in your preferred format (.txt, .md, or .pdf)

## How It Works

1. **Transcript Extraction** - Fetches the Youtube video transcript using youtube-transcript-plus API
2. **Text Chunking** - Splits the transcript into semantic chunks with timestamps
3. **Vector Embeddings** - Generates embeddings and stores them in Pinecone
4. **RAG Retrieval** - Retrieves relevant chunks based on your summary preferences
5. **AI Summarisation** - GPT-4o generates structured notes in your chosen style
6. **Interactive Q&A** - Ask follow-up questions using the same RAG system

## Project Structure

```
scrybe/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── youtubeQuery/    # RAG Q&A endpoint
│   │   │   └── youtubeSummary/  # Summarisation endpoint
│   │   ├── page.tsx              # Main UI
│   │   └── types.ts              # Type definitions
│   ├── components/
│   │   ├── MarkdownRenderer.tsx  # Renders notes with clickable timestamps
│   │   └── ui/                   # shadcn/ui components
│   └── lib/
│       └── utils.ts              # Utility functions
├── public/                       # Static assets
└── tests/                        # Jest tests
```

## Key Technologies Explained

### RAG (Retrieval-Augmented Generation)

Scrybe uses a sophisticated RAG system that:

- Evaluates context quality using quantitative metrics (chunk count, word count, similarity scores)
- Applies dynamic score thresholds based on query complexity
- Uses GPT-4o to assess context sufficiency for ambiguous cases
- Provides intelligent responses even when video content is insufficient

### Streaming Responses

Both summarisation and Q&A use streaming responses, allowing you to see results as they're generated rather than waiting for the entire response.

## Limitations

- Only supports YouTube videos (no local file uploads)
- English language content recommended for best results
- Requires videos to have available transcripts
