import {
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { playlists } from "./playlists";
import { videos } from "./videos";

/**
 * Ordered membership: playlist-scoped retrieval = filter chunks by `video_id IN (...)`.
 */
export const playlistVideos = pgTable(
  "playlist_videos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playlistId: uuid("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    /** Sort order within the playlist (0-based). */
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("playlist_videos_playlist_video_uidx").on(
      t.playlistId,
      t.videoId,
    ),
    uniqueIndex("playlist_videos_playlist_position_uidx").on(
      t.playlistId,
      t.position,
    ),
  ],
);
