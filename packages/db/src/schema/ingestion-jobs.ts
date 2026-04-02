import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { videos } from "./videos";
import { ingestionJobStatusEnum, ingestionJobTypeEnum } from "./enums";

/**
 * Async ingestion pipeline state. `owner_user_id` mirrors video ownership for
 * idempotency and queries without joining `videos` when useful.
 */
export const ingestionJobs = pgTable(
  "ingestion_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    type: ingestionJobTypeEnum("type").notNull(),
    status: ingestionJobStatusEnum("status").notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(5).notNull(),
    errorMessage: text("error_message"),
    errorCode: text("error_code"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    idempotencyKey: text("idempotency_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("ingestion_jobs_owner_idempotency_uidx").on(
      t.ownerUserId,
      t.idempotencyKey,
    ),
  ],
);
