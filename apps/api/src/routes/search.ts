import { chunks, videos } from "@lexora/db";
import { getDb } from "@lexora/db";
import {
  createQdrantClient,
  embedText,
  ensureLexoraCollection,
  searchChunks,
} from "@lexora/vectors";
import { and, eq, inArray } from "drizzle-orm";
import { Router, type Response } from "express";
import { isUuid } from "../lib/uuid";
import { requireAuth } from "../middleware/require-auth";

const router = Router();

const MAX_LIMIT = 25;
const DEFAULT_LIMIT = 8;

function jsonError(res: Response, status: number, error: string, message: string): void {
  res.status(status).json({ error, message });
}

router.post("/", requireAuth, async (req, res) => {
  const user = req.lexoraUser;
  if (!user) {
    jsonError(res, 500, "internal_error", "User not loaded");
    return;
  }

  const body = req.body as { query?: unknown; videoId?: unknown; limit?: unknown };
  const q = typeof body.query === "string" ? body.query.trim() : "";
  if (!q) {
    jsonError(res, 400, "invalid_body", 'Expected JSON body: { "query": "…", "videoId"?: "uuid", "limit"?: number }');
    return;
  }

  let videoId: string | undefined;
  if (body.videoId !== undefined && body.videoId !== null && body.videoId !== "") {
    if (typeof body.videoId !== "string" || !isUuid(body.videoId)) {
      jsonError(res, 400, "invalid_video_id", "Optional videoId must be a UUID");
      return;
    }
    videoId = body.videoId;
  }

  let limit = DEFAULT_LIMIT;
  if (body.limit !== undefined && body.limit !== null) {
    const n = Number(body.limit);
    if (!Number.isFinite(n) || n < 1) {
      jsonError(res, 400, "invalid_limit", "limit must be a positive number");
      return;
    }
    limit = Math.min(Math.floor(n), MAX_LIMIT);
  }

  const db = getDb();

  if (videoId) {
    const [owned] = await db
      .select({ id: videos.id })
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.ownerUserId, user.id)))
      .limit(1);
    if (!owned) {
      jsonError(res, 404, "not_found", "Video not found");
      return;
    }
  }

  try {
    const qdrant = createQdrantClient();
    await ensureLexoraCollection(qdrant);
    const queryVector = await embedText(q);
    const hits = await searchChunks(qdrant, queryVector, {
      ownerUserId: user.id,
      videoId,
      limit,
    });

    const chunkIds = hits.map((h) => h.payload?.chunkId).filter((id): id is string => Boolean(id));
    if (!chunkIds.length) {
      res.status(200).json({ results: [] });
      return;
    }

    const rows = await db
      .select({
        chunk: chunks,
        videoTitle: videos.title,
        youtubeVideoId: videos.youtubeVideoId,
      })
      .from(chunks)
      .innerJoin(videos, eq(chunks.videoId, videos.id))
      .where(and(eq(videos.ownerUserId, user.id), inArray(chunks.id, chunkIds)));

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

    const results = hits.flatMap((h) => {
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

    res.status(200).json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[search]", err);
    jsonError(res, 503, "search_unavailable", message);
  }
});

export const searchRouter = router;
