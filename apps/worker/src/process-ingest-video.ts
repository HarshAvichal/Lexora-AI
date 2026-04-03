import { chunks, ingestionJobs, videos } from "@lexora/db";
import { getDb } from "@lexora/db";
import { eq } from "drizzle-orm";
import { fetchTranscript } from "youtube-transcript";
import { transcriptLinesToChunks } from "./chunk-transcript";
import { fetchYouTubeOEmbed } from "./youtube-metadata";

const ERR_TRUNCATE = 4000;

function truncateErr(message: string): string {
  if (message.length <= ERR_TRUNCATE) return message;
  return `${message.slice(0, ERR_TRUNCATE)}…`;
}

async function markJobFailed(jobId: string, message: string, code?: string): Promise<void> {
  const db = getDb();
  await db
    .update(ingestionJobs)
    .set({
      status: "failed",
      errorMessage: truncateErr(message),
      errorCode: code ?? "ingest_error",
      completedAt: new Date(),
    })
    .where(eq(ingestionJobs.id, jobId));
}

/**
 * Runs the pipeline for a job already claimed into `resolving`.
 */
export async function processIngestVideoJob(jobId: string): Promise<void> {
  const db = getDb();

  const [job] = await db.select().from(ingestionJobs).where(eq(ingestionJobs.id, jobId)).limit(1);
  if (!job) {
    console.warn(`[worker] job ${jobId} not found, skipping`);
    return;
  }

  if (job.type !== "ingest_video") {
    console.warn(`[worker] job ${jobId} has unexpected type ${job.type}, skipping`);
    return;
  }

  const [video] = await db.select().from(videos).where(eq(videos.id, job.videoId)).limit(1);
  if (!video) {
    await markJobFailed(jobId, "Video row missing for job", "video_not_found");
    return;
  }

  const ytId = video.youtubeVideoId;

  try {
    const oembed = await fetchYouTubeOEmbed(ytId);
    if (oembed?.title ?? oembed?.authorName) {
      await db
        .update(videos)
        .set({
          title: oembed.title ?? video.title,
          channelTitle: oembed.authorName ?? video.channelTitle,
          updatedAt: new Date(),
        })
        .where(eq(videos.id, video.id));
    }

    await db
      .update(ingestionJobs)
      .set({ status: "fetching_transcript" })
      .where(eq(ingestionJobs.id, jobId));

    const lines = await fetchTranscript(ytId);
    if (!lines.length) {
      await markJobFailed(jobId, "No transcript segments returned for this video", "empty_transcript");
      return;
    }

    await db
      .update(ingestionJobs)
      .set({ status: "chunking" })
      .where(eq(ingestionJobs.id, jobId));

    const chunkRows = transcriptLinesToChunks(video.id, lines);

    if (!chunkRows.length) {
      await markJobFailed(jobId, "Transcript produced no chunkable text", "empty_chunks");
      return;
    }

    await db.transaction(async (tx) => {
      await tx.delete(chunks).where(eq(chunks.videoId, video.id));
      const batchSize = 200;
      for (let i = 0; i < chunkRows.length; i += batchSize) {
        const batch = chunkRows.slice(i, i + batchSize);
        await tx.insert(chunks).values(batch);
      }
    });

    await db
      .update(ingestionJobs)
      .set({ status: "embedding" })
      .where(eq(ingestionJobs.id, jobId));

    // Phase 1: embeddings + Qdrant not wired yet — advance status for observability.
    await db
      .update(ingestionJobs)
      .set({ status: "indexing" })
      .where(eq(ingestionJobs.id, jobId));

    await db
      .update(ingestionJobs)
      .set({
        status: "completed",
        completedAt: new Date(),
        errorMessage: null,
        errorCode: null,
      })
      .where(eq(ingestionJobs.id, jobId));

    console.log(`[worker] job ${jobId} completed (${chunkRows.length} chunks)`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[worker] job ${jobId} failed:`, err);
    await markJobFailed(jobId, message, "ingest_exception");
  }
}
