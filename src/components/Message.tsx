import React, { useState } from "react";
import { Copy, Paperclip, ChevronDown } from "lucide-react";

interface MessageProps {
  text: string;
  maxLength?: number;
  onCopy?: () => void;
  onEdit?: () => void;
  className?: string;
}

export function Message({
  text,
  maxLength = 150,
  onCopy,
  onEdit,
  className = "",
}: MessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const truncatedText =
    text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  const isTruncated = text.length > maxLength;
  const displayText = isExpanded ? text : truncatedText;

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    onCopy?.();
  };

  return (
    <div className={`w-[100%] flex-col gap-1 ${className}`}>
      {/* Message Bubble */}
      <div className="flex justify-end">
        <div
          className="bg-[#2D2E30] text-white rounded-2xl rounded-br-md px-4 py-3 pr-8"
          style={{
            backgroundColor: "#2D2E30",
          }}
        >
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
            {displayText}
          </p>

          {/* Dropdown Chevron */}
          {isTruncated && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute top-3 right-2 text-gray-400 hover:text-gray-300 transition-colors"
              aria-label={isExpanded ? "Collapse message" : "Expand message"}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
      </div>
      {/* bottom Icons */}
      <div className="flex justify-end pt-1">
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-gray-300 transition-colors p-1"
          aria-label="Copy message"
        >
          <Copy className="w-4 h-4 flex" />
        </button>
        {/* <button
          onClick={onEdit}
          className="text-gray-400 hover:text-gray-300 transition-colors p-1"
          aria-label="Edit message"
        >
          <Paperclip className="w-4 h-4" />
        </button> */}
      </div>
    </div>
  );
}
