export {
  embeddingDimension,
  embeddingModel,
  lexoraCollection,
  ollamaUrl,
  qdrantUrl,
} from "./config";
export { embedText, embedTexts } from "./ollama";
export {
  createQdrantClient,
  deleteQdrantPointsForVideo,
  ensureLexoraCollection,
  searchChunks,
  upsertChunkPoints,
  type ChunkPointPayload,
  type ChunkSearchHit,
} from "./qdrant";
