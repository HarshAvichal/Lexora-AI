import { chunks, videos } from "@lexora/db";
import { getDb } from "@lexora/db";
import {
  createQdrantClient,
  embedText,
  ensureLexoraCollection,
  searchChunks,
} from "@lexora/vectors";
import { and, eq, inArray } from "drizzle-orm";

export type SemanticChunkHit = {
  score: number;
  chunkId: string;
  videoId: string;
  videoTitle: string | null;
  youtubeVideoId: string;
  chunkIndex: number;
  startMs: number;
  endMs: number;
  chunkText: string;
};

/**
 * Embed the query, search Qdrant scoped to the user (and optional video), hydrate text from Postgres.
 */
export async function semanticRetrieve(opts: {
  ownerUserId: string;
  query: string;
  videoId?: string;
  limit: number;
}): Promise<SemanticChunkHit[]> {
  const db = getDb();
  const { ownerUserId, query, videoId, limit } = opts;

  if (videoId) {
    const [owned] = await db
      .select({ id: videos.id })
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.ownerUserId, ownerUserId)))
      .limit(1);
    if (!owned) {
      const err = new Error("VIDEO_NOT_FOUND") as Error & { code: string };
      err.code = "VIDEO_NOT_FOUND";
      throw err;
    }
  }

  const qdrant = createQdrantClient();
  await ensureLexoraCollection(qdrant);
  const queryVector = await embedText(query);
  const hits = await searchChunks(qdrant, queryVector, {
    ownerUserId,
    videoId,
    limit,
  });

  const chunkIds = hits.map((h) => h.payload?.chunkId).filter((id): id is string => Boolean(id));
  if (!chunkIds.length) return [];

  const rows = await db
    .select({
      chunk: chunks,
      videoTitle: videos.title,
      youtubeVideoId: videos.youtubeVideoId,
    })
    .from(chunks)
    .innerJoin(videos, eq(chunks.videoId, videos.id))
    .where(and(eq(videos.ownerUserId, ownerUserId), inArray(chunks.id, chunkIds)));

  const byChunkId = new Map(
    rows.map((r) => [
      r.chunk.id,
      {
        chunkText: r.chunk.chunkText,
        chunkIndex: r.chunk.chunkIndex,
        startMs: r.chunk.startMs,
        endMs: r.chunk.endMs,
        videoId: r.chunk.videoId,
        videoTitle: r.videoTitle,
        youtubeVideoId: r.youtubeVideoId,
      },
    ]),
  );

  return hits.flatMap((h) => {
    const cid = h.payload?.chunkId;
    if (!cid) return [];
    const row = byChunkId.get(cid);
    if (!row) return [];
    return [
      {
        score: h.score,
        chunkId: cid,
        videoId: row.videoId,
        videoTitle: row.videoTitle,
        youtubeVideoId: row.youtubeVideoId,
        chunkIndex: row.chunkIndex,
        startMs: row.startMs,
        endMs: row.endMs,
        chunkText: row.chunkText,
      },
    ];
  });
}
