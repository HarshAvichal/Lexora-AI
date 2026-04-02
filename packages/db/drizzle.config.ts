import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load repo-root `.env` when commands run from `packages/db`
config({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
