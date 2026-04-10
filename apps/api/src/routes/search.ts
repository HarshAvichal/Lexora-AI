import { Router, type Response } from "express";
import { isUuid } from "../lib/uuid";
import { requireAuth } from "../middleware/require-auth";
import { semanticRetrieve } from "../services/semantic-retrieval";

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

  try {
    const results = await semanticRetrieve({
      ownerUserId: user.id,
      query: q,
      videoId,
      limit,
    });
    res.status(200).json({ results });
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === "VIDEO_NOT_FOUND") {
      jsonError(res, 404, "not_found", "Video not found");
      return;
    }
    const message = e instanceof Error ? e.message : String(err);
    console.error("[search]", err);
    jsonError(res, 503, "search_unavailable", message);
  }
});

export const searchRouter = router;
