import { ingestionJobs } from "@lexora/db";
import { getDb } from "@lexora/db";
import { and, eq } from "drizzle-orm";
import { Router, type Response } from "express";
import { isUuid } from "../lib/uuid";
import { requireAuth } from "../middleware/require-auth";

const router = Router();

function jsonError(res: Response, status: number, error: string, message: string): void {
  res.status(status).json({ error, message });
}

function serializeJob(row: typeof ingestionJobs.$inferSelect) {
  return {
    id: row.id,
    videoId: row.videoId,
    type: row.type,
    status: row.status,
    attemptCount: row.attemptCount,
    maxAttempts: row.maxAttempts,
    errorMessage: row.errorMessage,
    errorCode: row.errorCode,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
  };
}

/**
 * Single ingestion job (must belong to the authenticated user).
 */
router.get("/:jobId", requireAuth, async (req, res) => {
  const user = req.lexoraUser;
  if (!user) {
    jsonError(res, 500, "internal_error", "User not loaded");
    return;
  }

  const jobId = req.params.jobId;
  if (!isUuid(jobId)) {
    jsonError(res, 400, "invalid_id", "Invalid job id");
    return;
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(ingestionJobs)
    .where(and(eq(ingestionJobs.id, jobId), eq(ingestionJobs.ownerUserId, user.id)))
    .limit(1);

  if (!row) {
    jsonError(res, 404, "not_found", "Job not found");
    return;
  }

  res.status(200).json({ job: serializeJob(row) });
});

export const ingestionJobsRouter = router;
