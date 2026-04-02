import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

export type LexoraDb = NodePgDatabase<typeof schema>;

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is missing. Copy .env.example to .env at the repo root or export DATABASE_URL.",
    );
  }
  return url;
}

let pool: pg.Pool | undefined;

/** Shared pool for API, worker, and scripts. */
export function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: requireDatabaseUrl(),
      max: 10,
    });
  }
  return pool;
}

/** Drizzle client with full schema types. */
export function getDb(): LexoraDb {
  return drizzle(getPool(), { schema });
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
