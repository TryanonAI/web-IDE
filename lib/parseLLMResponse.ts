export type ParsedChunk =
  | { type: 'text'; content: string }
  | { type: 'file'; content: string }
  | { type: 'delete'; content: string }
  | { type: 'rename'; from: string; to: string }
  | { type: 'dependency'; name: string; version: string };

export function parseLLMResponse(response: string): ParsedChunk[] {
  const result: ParsedChunk[] = [];

  // Strip wrappers
  const cleaned = response
    .replace(/<\/?anon-code>/g, '')
    .replace(/<\/?anon-thinking>/g, '')
    .replace(/<\/?anon-error>/g, '')
    .replace(/<\/?anon-success>/g, '');

  const anonWriteRegex = /<anon-write file_path="([^"]+)">[\s\S]*?<\/anon-write>/g;
  const anonDeleteRegex = /<anon-delete file_path="([^"]+)"\s*\/?>/g;
  const anonRenameRegex = /<anon-rename original_path="([^"]+)" new_path="([^"]+)"\s*\/?>/g;
  const anonDependencyRegex = /<anon-add-dependency name="([^"]+)" version="([^"]+)"\s*\/?>/g;

  let lastIndex = 0;

  // Helper to push plain text between matches
  function pushText(from: number, to: number) {
    const rawText = cleaned.slice(from, to).trim();
    if (rawText) result.push({ type: 'text', content: rawText });
  }

  // Combine all matches into one array so we can process in order
  const matches = [
    ...[...cleaned.matchAll(anonWriteRegex)].map((m) => ({ type: 'file', index: m.index!, filePath: m[1], length: m[0].length })),
    ...[...cleaned.matchAll(anonDeleteRegex)].map((m) => ({ type: 'delete', index: m.index!, filePath: m[1], length: m[0].length })),
    ...[...cleaned.matchAll(anonRenameRegex)].map((m) => ({ type: 'rename', index: m.index!, from: m[1], to: m[2], length: m[0].length })),
    ...[...cleaned.matchAll(anonDependencyRegex)].map((m) => ({ type: 'dependency', index: m.index!, name: m[1], version: m[2], length: m[0].length }))
  ].sort((a, b) => a.index - b.index);

  for (const m of matches) {
    if (m.index > lastIndex) {
      pushText(lastIndex, m.index);
    }

    switch (m.type) {
      case 'file':
        // @ts-expect-error ignore
        result.push({ type: 'file', content: m.filePath });
        break;
      case 'delete':
        // @ts-expect-error ignore
        result.push({ type: 'delete', content: m.filePath });
        break;
      case 'rename':
        // @ts-expect-error ignore
        result.push({ type: 'rename', from: m.from, to: m.to });
        break;
      case 'dependency':
        // @ts-expect-error ignore
        result.push({ type: 'dependency', name: m.name, version: m.version });
        break;
    }

    lastIndex = m.index + m.length;
  }

  pushText(lastIndex, cleaned.length);
  return result;
}
