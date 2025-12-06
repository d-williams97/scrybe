"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MarkdownRendererProps } from "@/app/types";

export function MarkdownRenderer({
  content,
  className = "",
  onTimestampClick,
}: MarkdownRendererProps) {
  // Turn (mm:ss) timestamps into clickable links
  const processedContent = content.replace(
    /\((\d+):(\d{2})\)/g,
    (match, minutes, seconds) => {
      const totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);
      return `[(${minutes}:${seconds})](<#timestamp-${totalSeconds}>)`;
    }
  );

  return (
    <div
      className={`prose prose-invert prose-base max-w-none 
        prose-headings:text-white prose-headings:font-semibold
        prose-h1:text-2xl prose-h1:mt-6 prose-h1:mb-3
        prose-h2:text-xl prose-h2:mt-5 prose-h2:mb-2
        prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
        prose-p:text-base prose-p:text-gray-200 prose-p:mb-3 prose-p:leading-relaxed
        prose-ul:text-base prose-ul:text-gray-200 prose-ul:mb-3
        prose-ol:text-base prose-ol:text-gray-200 prose-ol:mb-3
        prose-li:text-base prose-li:text-gray-200 prose-li:my-0.5
        prose-strong:text-white prose-strong:font-semibold
        prose-code:bg-white/10 prose-code:text-pink-400 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-white/5 prose-pre:p-4 prose-pre:rounded-lg
        prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-300
        prose-a:text-primary prose-a:hover:underline
        ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            // Check if it's our custom timestamp link
            if (href?.startsWith("#timestamp-") && onTimestampClick) {
              const seconds = parseInt(href.split("-")[1]);
              return (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onTimestampClick(seconds);
                  }}
                  className="text-blue-500 hover:text-blue-400 font-mono font-medium hover:underline cursor-pointer bg-transparent border-none p-0 inline"
                  title={`Jump to ${children}`}
                >
                  {children}
                </button>
              );
            }
            // Default link behavior
            return (
              <a
                href={href}
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
