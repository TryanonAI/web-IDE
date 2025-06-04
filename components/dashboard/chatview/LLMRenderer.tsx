// components/LLMRenderer.tsx
import { parseLLMResponse } from '@/lib/parseLLMResponse';
import React from 'react';

interface Props {
  llmResponse: string;
}

const LLMRenderer: React.FC<Props> = ({ llmResponse }) => {
  const parsed = parseLLMResponse(llmResponse);

  return (
    <div className="space-y-4 text-white">
      {parsed.map((chunk, index) =>
        chunk.type === 'file' ? (
          <div
            key={index}
            className="p-3 rounded-lg border border-white/30 bg-white/10 font-mono text-sm"
          >
            {chunk.content}
          </div>
        ) : (
          <p key={index} className="text-base leading-relaxed whitespace-pre-wrap">
            {/* @ts-expect-error ignore */}
            {chunk.content}
          </p>
        )
      )}
    </div>
  );
};

export default LLMRenderer;
