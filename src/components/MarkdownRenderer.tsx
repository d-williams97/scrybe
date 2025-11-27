"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  return (
    <div
      className={`prose prose-invert prose-sm max-w-none 
        prose-headings:text-white prose-headings:font-semibold
        prose-h1:text-2xl prose-h1:mt-6 prose-h1:mb-3
        prose-h2:text-xl prose-h2:mt-5 prose-h2:mb-2
        prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
        prose-p:text-gray-200 prose-p:mb-3 prose-p:leading-relaxed
        prose-ul:text-gray-200 prose-ul:mb-3
        prose-ol:text-gray-200 prose-ol:mb-3
        prose-li:text-gray-200 prose-li:my-0.5
        prose-strong:text-white prose-strong:font-semibold
        prose-code:bg-white/10 prose-code:text-pink-400 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-white/5 prose-pre:p-4 prose-pre:rounded-lg
        prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-300
        prose-a:text-primary prose-a:hover:underline
        ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
