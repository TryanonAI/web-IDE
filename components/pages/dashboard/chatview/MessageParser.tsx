import React from 'react';
import Markdown from 'react-markdown';

interface MessageParserProps {
  content: string;
}

interface ContentPart {
  type: 'text' | 'file-path';
  content: string;
}

const MessageParser: React.FC<MessageParserProps> = ({ content }) => {
  // Function to parse content sequentially
  const parseContent = (text: string): ContentPart[] => {
    const parts: ContentPart[] = [];
    let currentPosition = 0;

    // Regular expression to match <anon-write> tags and their content
    const regex = /<anon-write file_path="([^"]+)">[^]*?<\/anon-write>/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add any text that comes before the tag
      if (match.index > currentPosition) {
        const beforeText = text.slice(currentPosition, match.index).trim();
        if (beforeText) {
          parts.push({
            type: 'text',
            content: beforeText
          });
        }
      }

      // Add the file path
      parts.push({
        type: 'file-path',
        content: match[1] // The captured file path
      });

      currentPosition = match.index + match[0].length;
    }

    // Add any remaining text after the last tag
    const remainingText = text.slice(currentPosition).trim();
    if (remainingText) {
      parts.push({
        type: 'text',
        content: remainingText
      });
    }

    return parts;
  };

  // Function to clean non-anon-write XML tags
  const cleanXmlTags = (text: string) => {
    // Remove all XML tags except anon-write
    return text.replace(/<(?!\/?anon-write).*?>/g, '');
  };

  const renderPart = (part: ContentPart, index: number) => {
    if (part.type === 'file-path') {
      return (
        <div 
          key={`file-${index}`} 
          className="my-2 bg-secondary/30 p-2.5 rounded-md flex items-center gap-2 border border-border/50"
        >
          <svg
            className="w-4 h-4 text-secondary-foreground/70"
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
          <code className="text-sm text-secondary-foreground font-mono">
            {part.content}
          </code>
        </div>
      );
    }

    return (
      <div key={`text-${index}`} className="prose dark:prose-invert max-w-none">
        <Markdown>{cleanXmlTags(part.content)}</Markdown>
      </div>
    );
  };

  const renderContent = () => {
    const parts = parseContent(content);
    
    return (
      <div className="space-y-1">
        {parts.map((part, index) => renderPart(part, index))}
      </div>
    );
  };

  return renderContent();
};

export default MessageParser; 