import { Router, type Request, type Response } from "express";
import { ollamaChatStream } from "../lib/ollama-chat";
import { isUuid } from "../lib/uuid";
import { requireAuth } from "../middleware/require-auth";
import { buildRagChatPayload, generateRagAnswer } from "../services/rag-answer";
import { semanticRetrieve } from "../services/semantic-retrieval";

const router = Router();

const MAX_CONTEXT = 16;
const DEFAULT_CONTEXT = 10;

function jsonError(res: Response, status: number, error: string, message: string): void {
  res.status(status).json({ error, message });
}

type ParsedAskBody =
  | { ok: true; query: string; videoId?: string; limit: number }
  | { ok: false; status: number; error: string; message: string };

function parseAskBody(req: Request): ParsedAskBody {
  const body = req.body as { query?: unknown; videoId?: unknown; limit?: unknown };
  const q = typeof body.query === "string" ? body.query.trim() : "";
  if (!q) {
    return {
      ok: false,
      status: 400,
      error: "invalid_body",
      message: 'Expected JSON body: { "query": "…", "videoId"?: "uuid", "limit"?: number }',
    };
  }

  let videoId: string | undefined;
  if (body.videoId !== undefined && body.videoId !== null && body.videoId !== "") {
    if (typeof body.videoId !== "string" || !isUuid(body.videoId)) {
      return {
        ok: false,
        status: 400,
        error: "invalid_video_id",
        message: "Optional videoId must be a UUID",
      };
    }
    videoId = body.videoId;
  }

  let limit = DEFAULT_CONTEXT;
  if (body.limit !== undefined && body.limit !== null) {
    const n = Number(body.limit);
    if (!Number.isFinite(n) || n < 1) {
      return {
        ok: false,
        status: 400,
        error: "invalid_limit",
        message: "limit must be a positive number",
      };
    }
    limit = Math.min(Math.floor(n), MAX_CONTEXT);
  }

  return { ok: true, query: q, videoId, limit };
}

router.post("/", requireAuth, async (req, res) => {
  const user = req.lexoraUser;
  if (!user) {
    jsonError(res, 500, "internal_error", "User not loaded");
    return;
  }

  const parsed = parseAskBody(req);
  if (!parsed.ok) {
    jsonError(res, parsed.status, parsed.error, parsed.message);
    return;
  }

  const { query: q, videoId, limit } = parsed;

  try {
    const hits = await semanticRetrieve({
      ownerUserId: user.id,
      query: q,
      videoId,
      limit,
    });

    const { answer, citations } = await generateRagAnswer(q, hits);
    res.status(200).json({ answer, citations });
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === "VIDEO_NOT_FOUND") {
      jsonError(res, 404, "not_found", "Video not found");
      return;
    }
    const message = e instanceof Error ? e.message : String(err);
    console.error("[ask]", err);
    jsonError(res, 503, "ask_unavailable", message);
  }
});

/**
 * Server-Sent Events: `data: {"type":"citations"|"delta"|"done"|"error", ...}\n\n`
 */
router.post("/stream", requireAuth, async (req, res) => {
  const user = req.lexoraUser;
  if (!user) {
    jsonError(res, 500, "internal_error", "User not loaded");
    return;
  }

  const parsed = parseAskBody(req);
  if (!parsed.ok) {
    jsonError(res, parsed.status, parsed.error, parsed.message);
    return;
  }

  const { query: q, videoId, limit } = parsed;

  const sendSse = (obj: unknown) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof (res as Response & { flushHeaders?: () => void }).flushHeaders === "function") {
    (res as Response & { flushHeaders: () => void }).flushHeaders();
  }

  try {
    const hits = await semanticRetrieve({
      ownerUserId: user.id,
      query: q,
      videoId,
      limit,
    });

    const payload = buildRagChatPayload(q, hits);

    if (payload.kind === "empty") {
      sendSse({ type: "citations", citations: [] });
      sendSse({ type: "delta", text: payload.answer });
      sendSse({ type: "done" });
      res.end();
      return;
    }

    sendSse({ type: "citations", citations: payload.citations });

    await ollamaChatStream(payload.messages, (delta) => {
      if (delta) sendSse({ type: "delta", text: delta });
    });

    sendSse({ type: "done" });
    res.end();
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === "VIDEO_NOT_FOUND") {
      sendSse({ type: "error", message: "Video not found", code: "not_found" });
      res.end();
      return;
    }
    const message = e instanceof Error ? e.message : String(err);
    console.error("[ask/stream]", err);
    sendSse({ type: "error", message });
    res.end();
  }
});

export const askRouter = router;
