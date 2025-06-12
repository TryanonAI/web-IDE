// This code is from the second snippet provided.
// Assumed to be in a file like './chatview/FileGenerationIndicator.tsx'

import { Loader2Icon } from 'lucide-react';
import Markdown from 'react-markdown';
import { useMemo } from 'react';

// FileGenerationIndicator Component: No major issues found. Looks good.
const FileGenerationIndicator = ({
  filename,
  isGenerating,
}: {
  filename: string;
  isGenerating: boolean;
}) => (
  <div
    className="flex items-center justify-center w-full gap-2 my-3 p-2.5 border border-gray-500 dark:border-gray-400 rounded-md text-sm bg-gray-800 dark:bg-gray-700" // Adjusted for dark theme from image
  >
    {/* Optional: Icon for generating state */}
    {isGenerating && (
      <Loader2Icon className="w-4 h-4 animate-spin text-blue-400" />
    )}

    <span className="text-gray-300 dark:text-gray-200">
      {filename} {isGenerating ? 'generating...' : 'generated'}
    </span>
  </div>
);

// processStreamContent Function:
// The logic for parsing <anon-write> tags seems reasonable for non-nested cases.
// The @ts-expect-error comment for closing tags was noted. The current implementation,
// which updates the most recent 'file-generating' part, should work for typical linear generation.
function processStreamContent(rawContent: string) {
  const parts: Array<{
    type: 'text' | 'file-generating' | 'file-completed';
    content?: string; // For text parts
    filename?: string; // For file parts
    filepath?: string; // For file parts
    id: string;
  }> = [];
  let currentIndex = 0;
  let fileCounter = 0; // For unique key generation

  // Regex to find <anon-write ...> or </anon-write>
  const tagRegex = /<anon-write\s+filepath="([^"]+)"[^>]*>|<\/anon-write>/g;
  let match;

  while ((match = tagRegex.exec(rawContent)) !== null) {
    // Add text before this tag
    if (match.index > currentIndex) {
      const textContent = rawContent.slice(currentIndex, match.index);
      if (textContent.trim()) {
        parts.push({
          type: 'text',
          content: textContent,
          id: `text-${fileCounter}-${parts.length}`, // Unique ID
        });
      }
    }

    if (match[0].startsWith('<anon-write')) {
      // Opening tag - file generation starts
      const filepath = match[1];
      const filename = filepath.split('/').pop() || 'unknown-file'; // Extract filename
      parts.push({
        type: 'file-generating',
        filename,
        filepath,
        id: `file-gen-${fileCounter++}`, // Unique ID for this file instance
      });
    } else {
      // Closing </anon-write> tag - file generation completes
      // Find the most recent 'file-generating' part and mark it as 'file-completed'
      for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i].type === 'file-generating') {
          parts[i] = { // Create a new object for React's change detection
            ...parts[i],
            type: 'file-completed',
          };
          break;
        }
      }
    }
    currentIndex = match.index + match[0].length;
  }

  // Add any remaining text after the last tag
  if (currentIndex < rawContent.length) {
    const textContent = rawContent.slice(currentIndex);
    if (textContent.trim()) {
      parts.push({
        type: 'text',
        content: textContent,
        id: `text-${fileCounter}-${parts.length}`, // Unique ID
      });
    }
  }
  return parts;
}

// MessageContent Component: Looks good.
// It correctly uses useMemo for processStreamContent and renders parts.
const MessageContent = ({
  content, // This is the raw string from the model, e.g., "Text <anon-write...> Text"
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) => {
  const parts = useMemo(() => processStreamContent(content), [content]);

  return (
    <div className="message-content"> {/* This outer div is standard */}
      {parts.map((part) => {
        switch (part.type) {
          case 'text':
            return (
              // Each text part rendered by Markdown
              // Markdown itself usually renders <p> tags which are block-level
              <div key={part.id} className="prose prose-sm dark:prose-invert max-w-none"> {/* prose classes for nice markdown styling */}
                <Markdown>{part.content || ''}</Markdown>
              </div>
            );
          case 'file-generating':
            return (
              <FileGenerationIndicator
                key={part.id}
                filename={part.filename || 'file'}
                isGenerating={true}
              />
            );
          case 'file-completed':
            return (
              <FileGenerationIndicator
                key={part.id}
                filename={part.filename || 'file'}
                isGenerating={false}
              />
            );
          default:
            return null;
        }
      })}
      {/* General streaming indicator for the whole message, if not showing a file generating */}
      {isStreaming && !parts.some(p => p.type === 'file-generating') && (
        <span className="inline-block w-1.5 h-4 bg-blue-500 animate-pulse ml-1 rounded-sm" />
      )}
    </div>
  );
};

export { FileGenerationIndicator, MessageContent };
