import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * One row per YouTube video **per Lexora user** (same global video → separate rows).
 */
export const videos = pgTable(
  "videos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    youtubeVideoId: text("youtube_video_id").notNull(),
    title: text("title"),
    channelTitle: text("channel_title"),
    durationSeconds: integer("duration_seconds"),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("videos_owner_youtube_uidx").on(t.ownerUserId, t.youtubeVideoId),
  ],
);
