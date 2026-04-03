export type TranscriptLine = {
  text: string;
  /** Seconds from video start */
  offset: number;
  /** Segment length in seconds */
  duration: number;
};

export type ChunkInsert = {
  videoId: string;
  chunkIndex: number;
  startMs: number;
  endMs: number;
  chunkText: string;
};

/**
 * Merge caption lines into larger RAG segments (character budget + max time span).
 */
export function transcriptLinesToChunks(
  videoId: string,
  lines: TranscriptLine[],
  opts?: { maxChars?: number; maxSpanMs?: number },
): ChunkInsert[] {
  const maxChars = opts?.maxChars ?? 1200;
  const maxSpanMs = opts?.maxSpanMs ?? 45_000;

  const out: ChunkInsert[] = [];
  let buf: string[] = [];
  let startMs = 0;
  let endMs = 0;
  let chunkIndex = 0;

  const flush = () => {
    if (buf.length === 0) return;
    const chunkText = buf.join(" ").replace(/\s+/g, " ").trim();
    buf = [];
    if (!chunkText) return;
    out.push({ videoId, chunkIndex: chunkIndex++, startMs, endMs, chunkText });
  };

  for (const line of lines) {
    const t = line.text.trim();
    if (!t) continue;

    const segStart = Math.floor(line.offset * 1000);
    const segEnd = Math.ceil((line.offset + line.duration) * 1000);

    if (buf.length === 0) {
      startMs = segStart;
      endMs = segEnd;
      buf.push(t);
      continue;
    }

    const merged = [...buf, t].join(" ");
    const span = segEnd - startMs;
    if (merged.length > maxChars || span > maxSpanMs) {
      flush();
      startMs = segStart;
      endMs = segEnd;
      buf.push(t);
    } else {
      buf.push(t);
      endMs = segEnd;
    }
  }

  flush();
  return out;
}
