import { pgEnum } from "drizzle-orm/pg-core";

/** What the worker is doing (extend for re-embed, playlist batches, etc.). */
export const ingestionJobTypeEnum = pgEnum("ingestion_job_type", [
  "ingest_video",
  "reindex",
  "playlist_batch",
]);

/** Worker lifecycle; UI and retries key off this. */
export const ingestionJobStatusEnum = pgEnum("ingestion_job_status", [
  "queued",
  "resolving",
  "fetching_transcript",
  "chunking",
  "embedding",
  "indexing",
  "completed",
  "failed",
]);
