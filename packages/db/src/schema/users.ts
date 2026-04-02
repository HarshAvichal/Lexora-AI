import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Maps Firebase Auth users to an internal UUID used across FKs.
 * RLS-style scoping in app code: always filter by users.id (via ownership on videos, etc.).
 */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  displayName: text("display_name"),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
