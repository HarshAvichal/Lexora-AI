import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

const candidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "..", "..", ".env"),
];

for (const p of candidates) {
  if (fs.existsSync(p)) {
    config({ path: p });
    break;
  }
}
