// components/LLMRenderer.tsx
import React from 'react';
import { AnimatedSpan } from '@/components/magicui/terminal';
import { Loader2 } from 'lucide-react';
import { parseLLMResponse } from '@/lib/utils';
import { ParsedChunk } from '@/lib/utils/parseLLMResponse';

interface Props {
  llmResponse: string;
  streamedContent?: string;
  isUserMessage?: boolean;
}

const renderFormattedText = (text: string) => {
  // First split by code markers (backticks)
  const segments = text?.split(/(`[^`]+`)/g);

  return segments?.map((segment, mainIndex) => {
    if (segment?.startsWith('`') && segment?.endsWith('`')) {
      // This is a code segment
      const code = segment.slice(1, -1);
      return (
        <code
          key={mainIndex}
          className="px-1.5 py-0.5 rounded bg-muted/50 font-mono text-sm text-primary border border-border/10"
        >
          {code}
        </code>
      );
    }

    // For non-code segments, process bold markers
    const parts = segment?.split(/(\*\*.*?\*\*)/g);
    return parts?.map((part, index) => {
      if (part?.startsWith('**') && part?.endsWith('**')) {
        // Remove the markers and render as bold
        const boldText = part.slice(2, -2);
        return (
          <strong key={`${mainIndex}-${index}`} className="font-semibold">
            {boldText}
          </strong>
        );
      }
      return (
        <React.Fragment key={`${mainIndex}-${index}`}>{part}</React.Fragment>
      );
    });
  });
};

const FileChunk: React.FC<{
  content: string;
  isComplete?: boolean;
  isGeneratingFile: boolean;
}> = ({ content, isComplete = false, isGeneratingFile }) => (
  <AnimatedSpan
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
      <span className="truncate">{content}</span>
    </div>
    {(!isComplete || isGeneratingFile) && (
      <div className="flex items-center gap-2 text-xs text-white/70">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Generating...</span>
      </div>
    )}
  </AnimatedSpan>
);

const LLMRenderer: React.FC<Props> = ({ llmResponse, streamedContent }) => {
  const parsed = parseLLMResponse(llmResponse) as ParsedChunk[];
  const isGeneratingFile = Boolean(streamedContent && streamedContent.includes('<anon-write'));

  return (
    <div className="space-y-4 tracking-wide">
      {parsed.map((chunk, index) => {
        if (chunk.type === 'file') {
          return (
            <FileChunk
              key={index}
              content={chunk.content}
              isComplete={chunk.isComplete}
              isGeneratingFile={isGeneratingFile}
            />
          );
        }

        if (chunk.type === 'text') {
          return (
            <p
              key={index}
              className="text-base leading-relaxed whitespace-pre-wrap text-neutral-300"
            >
              {renderFormattedText(chunk.content)}
            </p>
          );
        }

        return null; // Handle other chunk types (delete, rename, dependency) if needed
      })}
    </div>
  );
};

export default LLMRenderer;
