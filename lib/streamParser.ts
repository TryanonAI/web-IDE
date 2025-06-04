type ParsedChunk =
  | { type: 'text'; content: string }
  | { type: 'file'; content: string }
  | { type: 'delete'; content: string }
  | { type: 'rename'; from: string; to: string }
  | { type: 'dependency'; name: string; version: string };

export function streamParser() {
  let buffer = "";
  const eventQueue: ParsedChunk[] = [];

  const processBuffer = () => {
    // Clean safe wrappers
    buffer = buffer.replace(/<\/?anon-code>/g, "")
                   .replace(/<\/?anon-thinking>/g, "")
                   .replace(/<\/?anon-error>/g, "")
                   .replace(/<\/?anon-success>/g, "");

    // Match one tag at a time
    let match;

    // anon-write
    const writeRegex = /<anon-write file_path="([^"]+)">[\s\S]*?<\/anon-write>/;
    if ((match = buffer.match(writeRegex))) {
      eventQueue.push({ type: "file", content: match[1] });
      buffer = buffer.replace(writeRegex, "");
    }

    // anon-delete
    const deleteRegex = /<anon-delete file_path="([^"]+)"\s*\/?>/;
    if ((match = buffer.match(deleteRegex))) {
      eventQueue.push({ type: "delete", content: match[1] });
      buffer = buffer.replace(deleteRegex, "");
    }

    // anon-rename
    const renameRegex = /<anon-rename original_path="([^"]+)" new_path="([^"]+)"\s*\/?>/;
    if ((match = buffer.match(renameRegex))) {
      eventQueue.push({ type: "rename", from: match[1], to: match[2] });
      buffer = buffer.replace(renameRegex, "");
    }

    // anon-add-dependency
    const depRegex = /<anon-add-dependency name="([^"]+)" version="([^"]+)"\s*\/?>/;
    if ((match = buffer.match(depRegex))) {
      eventQueue.push({ type: "dependency", name: match[1], version: match[2] });
      buffer = buffer.replace(depRegex, "");
    }

    // Plain text fallback
    const plainTextMatch = buffer.match(/^[^<]+/);
    if (plainTextMatch) {
      eventQueue.push({ type: "text", content: plainTextMatch[0] });
      buffer = buffer.slice(plainTextMatch[0].length);
    }
  };

  return {
    append(chunk: string) {
      buffer += chunk;
      processBuffer();
    },
    consume(): ParsedChunk[] {
      const output = [...eventQueue];
      eventQueue.length = 0;
      return output;
    },
  };
}


