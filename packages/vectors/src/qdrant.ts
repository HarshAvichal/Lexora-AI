import { QdrantClient } from "@qdrant/js-client-rest";
import { embeddingDimension, lexoraCollection, qdrantUrl } from "./config";

export function createQdrantClient(): QdrantClient {
  return new QdrantClient({ url: qdrantUrl(), checkCompatibility: false });
}

export async function ensureLexoraCollection(client: QdrantClient): Promise<void> {
  const name = lexoraCollection();
  const { collections } = await client.getCollections();
  if (collections.some((c) => c.name === name)) return;

  const dim = embeddingDimension();
  await client.createCollection(name, {
    vectors: { size: dim, distance: "Cosine" },
  });
}

export async function deleteQdrantPointsForVideo(
  client: QdrantClient,
  videoId: string,
): Promise<void> {
  await client.delete(lexoraCollection(), {
    wait: true,
    filter: {
      must: [{ key: "videoId", match: { value: videoId } }],
    },
  });
}

export type ChunkPointPayload = {
  chunkId: string;
  videoId: string;
  ownerUserId: string;
  chunkIndex: number;
  startMs: number;
  endMs: number;
};

export async function upsertChunkPoints(
  client: QdrantClient,
  rows: Array<{ id: string; vector: number[]; payload: ChunkPointPayload }>,
): Promise<void> {
  if (rows.length === 0) return;
  const coll = lexoraCollection();
  const batchSize = 64;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await client.upsert(coll, {
      wait: true,
      points: batch.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload as Record<string, unknown>,
      })),
    });
  }
}

export type ChunkSearchHit = {
  pointId: string;
  score: number;
  payload: ChunkPointPayload | null;
};

export async function searchChunks(
  client: QdrantClient,
  queryVector: number[],
  opts: { ownerUserId: string; videoId?: string; limit: number },
): Promise<ChunkSearchHit[]> {
  const must: Array<{ key: string; match: { value: string } }> = [
    { key: "ownerUserId", match: { value: opts.ownerUserId } },
  ];
  if (opts.videoId) {
    must.push({ key: "videoId", match: { value: opts.videoId } });
  }

  const hits = await client.search(lexoraCollection(), {
    vector: queryVector,
    limit: opts.limit,
    filter: { must },
    with_payload: true,
  });

  return hits.map((h) => {
    const pl = h.payload as Record<string, unknown> | null | undefined;
    const payload: ChunkPointPayload | null =
      pl &&
      typeof pl.chunkId === "string" &&
      typeof pl.videoId === "string" &&
      typeof pl.ownerUserId === "string"
        ? {
            chunkId: pl.chunkId,
            videoId: pl.videoId,
            ownerUserId: pl.ownerUserId,
            chunkIndex: Number(pl.chunkIndex) || 0,
            startMs: Number(pl.startMs) || 0,
            endMs: Number(pl.endMs) || 0,
          }
        : null;
    return {
      pointId: String(h.id),
      score: h.score ?? 0,
      payload,
    };
  });
}
