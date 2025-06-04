import { streamParser } from "@/lib/streamParser";
import { ParsedChunk } from "@/lib/parseLLMResponse";
import { useEffect, useRef, useState } from "react";

export function useStreamedChunks(sseUrl: string) {
  const [chunks, setChunks] = useState<ParsedChunk[]>([]);
  const parser = useRef(streamParser());

  useEffect(() => {
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (e) => {
      parser.current.append(e.data);

      const parsed = parser.current.consume();
      if (parsed.length > 0) {
        setChunks((prev) => [...prev, ...parsed]);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [sseUrl]);

  return chunks;
}
