import "./load-env";
import { claimNextQueuedIngestJob } from "./claim-job";
import { processIngestVideoJob } from "./process-ingest-video";

const POLL_MS = Math.max(500, Number(process.env.WORKER_POLL_MS ?? 2000));

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let shuttingDown = false;

async function tick(): Promise<void> {
  const jobId = await claimNextQueuedIngestJob();
  if (!jobId) {
    await sleep(POLL_MS);
    return;
  }
  await processIngestVideoJob(jobId);
}

async function main(): Promise<void> {
  console.log(`[lexora/worker] poll every ${POLL_MS}ms (WORKER_POLL_MS)`);

  while (!shuttingDown) {
    try {
      await tick();
    } catch (err) {
      console.error("[worker] tick error:", err);
      await sleep(POLL_MS);
    }
  }
}

function shutdown(): void {
  shuttingDown = true;
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch((err) => {
  console.error("[worker] fatal:", err);
  process.exit(1);
});
