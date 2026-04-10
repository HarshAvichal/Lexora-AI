import "./load-env";
import cors from "cors";
import express from "express";
import { getPool } from "@lexora/db";
import { requireAuth } from "./middleware/require-auth";
import { askRouter } from "./routes/ask";
import { ingestionJobsRouter } from "./routes/ingestion-jobs";
import { searchRouter } from "./routes/search";
import { videosRouter } from "./routes/videos";

const app = express();
const PORT = Number(process.env.API_PORT ?? process.env.PORT ?? 4000);

app.use(express.json());

const corsOrigins = process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()).filter(Boolean);
app.use(
  cors(
    corsOrigins?.length
      ? { origin: corsOrigins, credentials: true }
      : { origin: true },
  ),
);

app.get("/health", async (_req, res) => {
  try {
    await getPool().query("SELECT 1 AS ping");
    res.status(200).json({ ok: true, database: "up" });
  } catch (err) {
    console.error("[health] database check failed:", err);
    res.status(503).json({ ok: false, database: "down" });
  }
});

app.use("/v1/videos", videosRouter);
app.use("/v1/ingestion-jobs", ingestionJobsRouter);
app.use("/v1/search", searchRouter);
app.use("/v1/ask", askRouter);

app.get("/v1/me", requireAuth, (req, res) => {
  const u = req.lexoraUser;
  if (!u) {
    res.status(500).json({ error: "internal_error", message: "User not loaded" });
    return;
  }
  res.status(200).json({
    id: u.id,
    firebaseUid: u.firebaseUid,
    email: u.email,
    displayName: u.displayName,
  });
});

app.listen(PORT, () => {
  console.log(`[lexora/api] listening on http://localhost:${PORT}`);
});
