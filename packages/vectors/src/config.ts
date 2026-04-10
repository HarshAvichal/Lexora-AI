export function qdrantUrl(): string {
  return process.env.QDRANT_URL?.trim() || "http://127.0.0.1:6333";
}

export function ollamaUrl(): string {
  const raw = process.env.OLLAMA_HOST?.trim() || "http://127.0.0.1:11434";
  return raw.replace(/\/$/, "");
}

export function embeddingModel(): string {
  return process.env.OLLAMA_EMBEDDING_MODEL?.trim() || "nomic-embed-text";
}

/** Expected vector size; must match the Ollama embedding model (nomic-embed-text = 768). */
export function embeddingDimension(): number {
  const n = Number(process.env.EMBEDDING_DIMENSION);
  return Number.isFinite(n) && n > 0 ? n : 768;
}

export function lexoraCollection(): string {
  return process.env.QDRANT_COLLECTION?.trim() || "lexora_chunks";
}
