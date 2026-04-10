import { ollamaChat } from "../lib/ollama-chat";
import type { ChatMessage } from "../lib/ollama-chat";
import type { SemanticChunkHit } from "./semantic-retrieval";

const EXCERPT_MAX = 900;

export type AskCitation = {
  index: number;
  chunkId: string;
  videoId: string;
  videoTitle: string | null;
  youtubeVideoId: string;
  startMs: number;
  endMs: number;
  score: number;
  excerpt: string;
};

function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function buildContextBlock(hits: SemanticChunkHit[]): { block: string; citations: AskCitation[] } {
  const citations: AskCitation[] = hits.map((h, i) => {
    const excerpt = truncate(h.chunkText, EXCERPT_MAX);
    return {
      index: i + 1,
      chunkId: h.chunkId,
      videoId: h.videoId,
      videoTitle: h.videoTitle,
      youtubeVideoId: h.youtubeVideoId,
      startMs: h.startMs,
      endMs: h.endMs,
      score: h.score,
      excerpt,
    };
  });

  const block = hits
    .map((h, i) => {
      const title = h.videoTitle ?? "Untitled video";
      const t0 = formatClock(h.startMs);
      const t1 = formatClock(h.endMs);
      const body = truncate(h.chunkText, EXCERPT_MAX);
      return `[${i + 1}] (${title} @ ${t0}–${t1})\n${body}`;
    })
    .join("\n\n---\n\n");

  return { block, citations };
}

const SYSTEM_PROMPT_BASE = `You are Lexora. You answer ONLY from the numbered transcript excerpts in the user message—treat them as the entire world of facts you may use.

Hard rules (violating these is a failure):
- Do NOT use outside knowledge, textbook definitions, or “general” explanations unless those exact ideas appear in the excerpts. If the excerpts don’t define or mention something, say the video doesn’t cover it—do not fill in from your training data.
- Do NOT elaborate with analogies, examples, or standard CS/math facts that are not clearly supported by the excerpts.
- Every substantive sentence (anything that isn’t a brief transition) must carry at least one inline citation like [1] or [2][3]. If you cannot cite it, do not say it.
- Do not invent quotes, scenes, or timestamps. Paraphrase only what the excerpts support.
- If the question can’t be answered from the excerpts, say so in one short paragraph and stop.
- Speak naturally to the user (say “the video” / “they explain”), but never claim the video shows or says something unless an excerpt backs it up.`;

function scopeInstruction(hits: SemanticChunkHit[]): string {
  const videoIds = new Set(hits.map((h) => h.videoId));
  if (videoIds.size === 1) {
    return "Scope: All excerpts below are from a single video the user selected. Stay strictly within what is said there—no broader lesson beyond this recording.";
  }
  return "Scope: Excerpts may come from several of the user’s videos. Only combine or compare what the excerpts actually say; do not import outside material.";
}

export type RagChatPayload =
  | { kind: "empty"; answer: string; citations: [] }
  | { kind: "chat"; messages: ChatMessage[]; citations: AskCitation[] };

/**
 * Build chat messages + citation metadata for /v1/ask and /v1/ask/stream.
 */
export function buildRagChatPayload(userQuestion: string, hits: SemanticChunkHit[]): RagChatPayload {
  if (!hits.length) {
    return {
      kind: "empty",
      answer:
        "I couldn’t find any matching transcript in your library for that question. Try ingesting a video first, or rephrase your question.",
      citations: [],
    };
  }

  const { block, citations } = buildContextBlock(hits);
  const userContent = `${scopeInstruction(hits)}\n\nQuestion:\n${userQuestion}\n\nTranscript excerpts:\n\n${block}`;

  return {
    kind: "chat",
    messages: [
      { role: "system", content: SYSTEM_PROMPT_BASE },
      { role: "user", content: userContent },
    ],
    citations,
  };
}

/**
 * Runs a single RAG turn: retrieve hits should already be loaded.
 */
export async function generateRagAnswer(
  userQuestion: string,
  hits: SemanticChunkHit[],
): Promise<{ answer: string; citations: AskCitation[] }> {
  const payload = buildRagChatPayload(userQuestion, hits);
  if (payload.kind === "empty") {
    return { answer: payload.answer, citations: [] };
  }
  const answer = await ollamaChat(payload.messages);
  return { answer, citations: payload.citations };
}
