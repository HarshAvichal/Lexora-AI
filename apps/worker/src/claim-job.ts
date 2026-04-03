import { getPool } from "@lexora/db";

/**
 * Atomically claims one `queued` `ingest_video` job and moves it to `resolving`.
 * Returns the job id, or null if none available.
 */
export async function claimNextQueuedIngestJob(): Promise<string | null> {
  const pool = getPool();
  const result = await pool.query<{ id: string }>(`
    WITH picked AS (
      SELECT id
      FROM ingestion_jobs
      WHERE status = 'queued'
        AND type = 'ingest_video'
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE ingestion_jobs AS j
    SET
      status = 'resolving',
      started_at = COALESCE(j.started_at, now())
    FROM picked
    WHERE j.id = picked.id
    RETURNING j.id
  `);
  return result.rows[0]?.id ?? null;
}
