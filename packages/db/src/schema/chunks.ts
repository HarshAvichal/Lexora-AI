import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { videos } from "./videos";

/**
 * Transcript segments; `id` doubles as the Qdrant point id for simple alignment.
 */
export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    /** Order within the parent video (0-based). */
    chunkIndex: integer("chunk_index").notNull(),
    startMs: integer("start_ms").notNull(),
    endMs: integer("end_ms").notNull(),
    /** Canonical transcript text for this segment (RAG source of truth for Phase 1). */
    chunkText: text("chunk_text").notNull(),
    contentHash: text("content_hash"),
    embeddingModel: text("embedding_model"),
    embeddingVersion: text("embedding_version"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("chunks_video_chunk_index_uidx").on(t.videoId, t.chunkIndex)],
);
