import { ollamaUrl } from "@lexora/vectors";

export function chatModel(): string {
  return process.env.OLLAMA_CHAT_MODEL?.trim() || "llama3.2";
}

/** Lower = stick closer to provided context (default 0.15). */
export function chatTemperature(): number {
  const n = Number(process.env.OLLAMA_CHAT_TEMPERATURE);
  if (Number.isFinite(n) && n >= 0 && n <= 2) return n;
  return 0.15;
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Non-streaming chat completion against the local Ollama server.
 */
export async function ollamaChat(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${ollamaUrl()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: chatModel(),
      messages,
      stream: false,
      options: {
        temperature: chatTemperature(),
        top_p: 0.9,
      },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Ollama chat failed (${res.status}): ${t || res.statusText}`);
  }

  const data = (await res.json()) as { message?: { content?: string } };
  const text = data.message?.content?.trim();
  if (!text) {
    throw new Error("Ollama returned an empty assistant message");
  }
  return text;
}

/**
 * Stream assistant tokens from Ollama (`message.content` deltas per chunk).
 */
export async function ollamaChatStream(
  messages: ChatMessage[],
  onDelta: (text: string) => void,
): Promise<void> {
  const res = await fetch(`${ollamaUrl()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: chatModel(),
      messages,
      stream: true,
      options: {
        temperature: chatTemperature(),
        top_p: 0.9,
      },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Ollama chat stream failed (${res.status}): ${t || res.statusText}`);
  }

  if (!res.body) {
    throw new Error("Ollama stream has no body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        let j: { message?: { content?: string }; error?: string };
        try {
          j = JSON.parse(trimmed) as { message?: { content?: string }; error?: string };
        } catch {
          continue;
        }
        if (typeof j.error === "string" && j.error) {
          throw new Error(j.error);
        }
        const piece = j.message?.content;
        if (piece) onDelta(piece);
      }
    }
    if (buffer.trim()) {
      try {
        const j = JSON.parse(buffer.trim()) as { message?: { content?: string }; error?: string };
        if (typeof j.error === "string" && j.error) throw new Error(j.error);
        const piece = j.message?.content;
        if (piece) onDelta(piece);
      } catch {
        /* ignore trailing garbage */
      }
    }
  } finally {
    reader.releaseLock();
  }
}
