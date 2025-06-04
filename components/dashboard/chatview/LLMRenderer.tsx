// components/LLMRenderer.tsx
import { parseLLMResponse } from '@/lib/parseLLMResponse';
import React from 'react';
import { AnimatedSpan } from '@/components/magicui/terminal';
import { Loader2 } from 'lucide-react';

interface Props {
  llmResponse: string;
  streamedContent?: string;
}

interface ParsedChunk {
  type: 'text' | 'file';
  content: string;
}

const LLMRenderer: React.FC<Props> = ({ llmResponse, streamedContent }) => {
  const parsed = parseLLMResponse(llmResponse) as ParsedChunk[];
  const isGeneratingFile = llmResponse.includes('<anon-write') && streamedContent;

  return (
    <div className="space-y-4 text-white">
      {parsed.map((chunk, index) => {
        if (chunk.type === 'file') {
          return (
            <AnimatedSpan
              key={index}
              className="p-3 rounded-lg border border-white/30 bg-white/10 font-mono text-sm flex items-center justify-between gap-3"
              delay={100}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <svg
                  className="w-4 h-4 text-white/70 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="truncate">{chunk.content}</span>
              </div>
              {isGeneratingFile && (
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Generating...</span>
                </div>
              )}
            </AnimatedSpan>
          );
        }

        // Skip content between <anon-write> tags
        if (chunk.content?.includes('</anon-write>')) {
          return null;
        }

        // For regular text content
        return (
          <p key={index} className="text-base leading-relaxed whitespace-pre-wrap">
            {chunk.content}
          </p>
        );
      })}
    </div>
  );
};

export default LLMRenderer;
