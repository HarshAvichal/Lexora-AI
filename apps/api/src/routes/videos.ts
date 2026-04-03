import { ingestionJobs, videos } from "@lexora/db";
import { getDb } from "@lexora/db";
import { and, desc, eq, notInArray } from "drizzle-orm";
import { Router, type Response } from "express";
import { isUuid } from "../lib/uuid";
import { parseYouTubeVideoId } from "../lib/youtube";
import { requireAuth } from "../middleware/require-auth";

const router = Router();

function isPgUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}

function jsonError(res: Response, status: number, error: string, message: string): void {
  res.status(status).json({ error, message });
}

function serializeVideo(row: typeof videos.$inferSelect) {
  return {
    id: row.id,
    youtubeVideoId: row.youtubeVideoId,
    title: row.title,
    channelTitle: row.channelTitle,
    durationSeconds: row.durationSeconds,
    sourceUrl: row.sourceUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * List videos owned by the authenticated user (newest activity first).
 */
router.get("/", requireAuth, async (req, res) => {
  const user = req.lexoraUser;
  if (!user) {
    jsonError(res, 500, "internal_error", "User not loaded");
    return;
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(videos)
    .where(eq(videos.ownerUserId, user.id))
    .orderBy(desc(videos.updatedAt));

  res.status(200).json({ videos: rows.map(serializeVideo) });
});

/**
 * Single video (must belong to the authenticated user).
 */
router.get("/:videoId", requireAuth, async (req, res) => {
  const user = req.lexoraUser;
  if (!user) {
    jsonError(res, 500, "internal_error", "User not loaded");
    return;
  }

  const videoId = req.params.videoId;
  if (!isUuid(videoId)) {
    jsonError(res, 400, "invalid_id", "Invalid video id");
    return;
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(videos)
    .where(and(eq(videos.id, videoId), eq(videos.ownerUserId, user.id)))
    .limit(1);

  if (!row) {
    jsonError(res, 404, "not_found", "Video not found");
    return;
  }

  res.status(200).json({ video: serializeVideo(row) });
});

/**
 * Create or reuse the user's row for this YouTube video and enqueue (or return) an ingestion job.
 */
router.post("/", requireAuth, async (req, res) => {
  const user = req.lexoraUser;
  if (!user) {
    jsonError(res, 500, "internal_error", "User not loaded");
    return;
  }

  const body = req.body as { source?: unknown };
  const source = typeof body?.source === "string" ? body.source.trim() : "";
  if (!source) {
    jsonError(res, 400, "invalid_body", 'Expected JSON body: { "source": "<YouTube URL or video id>" }');
    return;
  }

  const youtubeVideoId = parseYouTubeVideoId(source);
  if (!youtubeVideoId) {
    jsonError(
      res,
      400,
      "invalid_youtube",
      "Could not parse a YouTube video id from `source`. Use a youtu.be or youtube.com link, or an 11-character id.",
    );
    return;
  }

  const db = getDb();

  let videoRow = (
    await db
      .select()
      .from(videos)
      .where(and(eq(videos.ownerUserId, user.id), eq(videos.youtubeVideoId, youtubeVideoId)))
      .limit(1)
  )[0];

  if (!videoRow) {
    try {
      const inserted = await db
        .insert(videos)
        .values({
          ownerUserId: user.id,
          youtubeVideoId,
          sourceUrl: source,
        })
        .returning();
      videoRow = inserted[0];
    } catch (err) {
      if (!isPgUniqueViolation(err)) throw err;
      const again = await db
        .select()
        .from(videos)
        .where(and(eq(videos.ownerUserId, user.id), eq(videos.youtubeVideoId, youtubeVideoId)))
        .limit(1);
      videoRow = again[0];
    }
  }

  if (!videoRow) {
    jsonError(res, 500, "internal_error", "Failed to load or create video row");
    return;
  }

  const terminal: ("completed" | "failed")[] = ["completed", "failed"];
  const [activeJob] = await db
    .select()
    .from(ingestionJobs)
    .where(
      and(eq(ingestionJobs.videoId, videoRow.id), notInArray(ingestionJobs.status, terminal)),
    )
    .orderBy(desc(ingestionJobs.createdAt))
    .limit(1);

  let jobRow = activeJob;
  if (!jobRow) {
    const inserted = await db
      .insert(ingestionJobs)
      .values({
        ownerUserId: user.id,
        videoId: videoRow.id,
        type: "ingest_video",
        status: "queued",
      })
      .returning();
    jobRow = inserted[0];
  }

  if (!jobRow) {
    jsonError(res, 500, "internal_error", "Failed to create ingestion job");
    return;
  }

  res.status(200).json({
    video: serializeVideo(videoRow),
    job: {
      id: jobRow.id,
      videoId: jobRow.videoId,
      type: jobRow.type,
      status: jobRow.status,
      attemptCount: jobRow.attemptCount,
      maxAttempts: jobRow.maxAttempts,
      errorMessage: jobRow.errorMessage,
      errorCode: jobRow.errorCode,
      startedAt: jobRow.startedAt,
      completedAt: jobRow.completedAt,
      createdAt: jobRow.createdAt,
    },
  });
});

export const videosRouter = router;
