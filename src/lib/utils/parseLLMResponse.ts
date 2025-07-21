export type ParsedChunk =
  | { type: 'text'; content: string }
  | { type: 'file'; content: string; isComplete?: boolean }
  | { type: 'delete'; content: string }
  | { type: 'rename'; from: string; to: string }
  | { type: 'dependency'; name: string };

type Match = 
  | { type: 'file-start'; index: number; filePath: string; length: number }
  | { type: 'file-end'; index: number; length: number }
  | { type: 'delete'; index: number; filePath: string; length: number }
  | { type: 'rename'; index: number; from: string; to: string; length: number }
  | { type: 'dependency'; index: number; name: string; length: number };

export function parseLLMResponse(response: string): ParsedChunk[] {
  const result: ParsedChunk[] = [];

  const cleaned = response
    .replace(/<\/?anon-code>/g, '')
    .replace(/<\/?anon-thinking>/g, '')
    .replace(/<\/?anon-error>/g, '')
    .replace(/<\/?anon-success>/g, '')
    .replace(/<\/?ai_message>/g, '')
    .replace(/<instructions-reminder>[\s\S]*?<\/instructions-reminder>/g, '');

  // Modified regex to capture incomplete anon-write tags
  const anonWriteStartRegex = /<anon-write file_path="([^"]+)">/g;
  const anonWriteEndRegex = /<\/anon-write>/g;
  const anonDeleteRegex = /<anon-delete file_path="([^"]+)"\s*\/?>/g;
  const anonRenameRegex = /<anon-rename original_file_path="([^"]+)" new_file_path="([^"]+)"\s*\/?>/g;
  const anonDependencyRegex = /<anon-add-dependency>(@?[^@<\s]+(?:\/[^@<\s]+)?)(?:@([^<\s]+))?<\/anon-add-dependency>/g;

  let lastIndex = 0;

  // Helper to push plain text between matches
  function pushText(from: number, to: number) {
    const rawText = cleaned.slice(from, to).trim();
    if (rawText) result.push({ type: 'text', content: rawText });
  }

  // Find all start and end positions
  const matches: Match[] = [
    ...[...cleaned.matchAll(anonWriteStartRegex)].map((m) => ({ 
      type: 'file-start' as const, 
      index: m.index!, 
      filePath: m[1], 
      length: m[0].length 
    })),
    ...[...cleaned.matchAll(anonWriteEndRegex)].map((m) => ({ 
      type: 'file-end' as const, 
      index: m.index!, 
      length: m[0].length 
    })),
    ...[...cleaned.matchAll(anonDeleteRegex)].map((m) => ({ 
      type: 'delete' as const, 
      index: m.index!, 
      filePath: m[1], 
      length: m[0].length 
    })),
    ...[...cleaned.matchAll(anonRenameRegex)].map((m) => ({ 
      type: 'rename' as const, 
      index: m.index!, 
      from: m[1], 
      to: m[2], 
      length: m[0].length 
    })),
    ...[...cleaned.matchAll(anonDependencyRegex)].map((m) => ({ 
      type: 'dependency' as const, 
      index: m.index!, 
      name: m[1], 
      length: m[0].length 
    }))
  ].sort((a, b) => a.index - b.index);

  let openFileTag: { filePath: string; startIndex: number } | null = null;

  for (const m of matches) {
    if (m.index > lastIndex) {
      // Only push text if we're not inside a file tag
      if (!openFileTag) {
        pushText(lastIndex, m.index);
      }
    }

    switch (m.type) {
      case 'file-start':
        openFileTag = { filePath: m.filePath, startIndex: m.index + m.length };
        result.push({ type: 'file', content: m.filePath, isComplete: false });
        break;
      case 'file-end':
        if (openFileTag) {
          // Update the last file chunk to mark it as complete
          const lastFileChunk = result.reverse().find(chunk => chunk.type === 'file');
          if (lastFileChunk) {
            lastFileChunk.isComplete = true;
          }
          openFileTag = null;
        }
        break;
      case 'delete':
        result.push({ type: 'delete', content: m.filePath });
        break;
      case 'rename':
        result.push({ type: 'rename', from: m.from, to: m.to });
        break;
      case 'dependency':
        result.push({ type: 'dependency', name: m.name });
        break;
    }

    lastIndex = m.index + m.length;
  }

  // Push any remaining text if we're not inside a file tag
  if (!openFileTag && lastIndex < cleaned.length) {
    pushText(lastIndex, cleaned.length);
  }

  return result;
}