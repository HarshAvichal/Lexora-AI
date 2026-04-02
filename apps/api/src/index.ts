import "./load-env";
import express from "express";
import { getPool } from "@lexora/db";

const app = express();
const PORT = Number(process.env.API_PORT ?? process.env.PORT ?? 4000);

app.get("/health", async (_req, res) => {
  try {
    await getPool().query("SELECT 1 AS ping");
    res.status(200).json({ ok: true, database: "up" });
  } catch (err) {
    console.error("[health] database check failed:", err);
    res.status(503).json({ ok: false, database: "down" });
  }
});

app.listen(PORT, () => {
  console.log(`[lexora/api] listening on http://localhost:${PORT}`);
});
