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

type ChatMessage = {
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
