import { embeddingDimension, embeddingModel, ollamaUrl } from "./config";

export async function embedText(text: string): Promise<number[]> {
  const host = ollamaUrl();
  const model = embeddingModel();
  const res = await fetch(`${host}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt: text }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Ollama embeddings failed (${res.status}): ${t || res.statusText}`);
  }
  const body = (await res.json()) as { embedding?: number[] };
  const vec = body.embedding;
  if (!vec?.length) {
    throw new Error("Ollama returned an empty embedding");
  }
  const expected = embeddingDimension();
  if (vec.length !== expected) {
    throw new Error(
      `Embedding length ${vec.length} does not match EMBEDDING_DIMENSION=${expected}. ` +
        "Fix the env var or use a different model.",
    );
  }
  return vec;
}

/**
 * Parallel embedding with a small concurrency limit to avoid saturating Ollama.
 */
export async function embedTexts(texts: string[], concurrency = 4): Promise<number[][]> {
  if (texts.length === 0) return [];
  const results: number[][] = new Array(texts.length);
  let index = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const i = index++;
      if (i >= texts.length) return;
      results[i] = await embedText(texts[i]!);
    }
  }

  const n = Math.min(concurrency, texts.length);
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}
