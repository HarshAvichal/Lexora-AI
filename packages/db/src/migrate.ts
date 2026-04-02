/**
 * Applies SQL files in `packages/db/drizzle/` using Drizzle's migrator.
 * Prefer: `npm run db:migrate` from the repo root.
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { closePool, getDb } from "./client";

function hasDrizzleMigrations(dir: string): boolean {
  return fs.existsSync(path.join(dir, "drizzle", "meta", "_journal.json"));
}

/** Supports cwd = `packages/db` (npm workspace) or repo root. */
function resolvePackageRoot(): string {
  const cwd = process.cwd();
  if (hasDrizzleMigrations(cwd)) return cwd;
  const fromRepoRoot = path.join(cwd, "packages", "db");
  if (hasDrizzleMigrations(fromRepoRoot)) return fromRepoRoot;
  throw new Error(
    "Could not find packages/db/drizzle. Run `npm run db:migrate` from the Lexora repo root.",
  );
}

function loadEnv(packageRoot: string): void {
  const repoRoot = path.resolve(packageRoot, "..", "..");
  const candidates = [
    path.join(repoRoot, ".env"),
    path.join(packageRoot, ".env"),
    path.join(process.cwd(), ".env"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      config({ path: p });
      return;
    }
  }
  console.warn(
    "[lexora/db] No .env file found; using process.env only (set DATABASE_URL).",
  );
}

const packageRoot = resolvePackageRoot();
loadEnv(packageRoot);

async function main(): Promise<void> {
  const migrationsFolder = path.join(packageRoot, "drizzle");
  await migrate(getDb(), { migrationsFolder });
  console.log("[lexora/db] Migrations finished.");
  await closePool();
}

main().catch(async (err: unknown) => {
  console.error(err);
  try {
    await closePool();
  } catch {
    /* ignore shutdown errors */
  }
  process.exit(1);
});
