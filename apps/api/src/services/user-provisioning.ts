import { users } from "@lexora/db";
import { getDb } from "@lexora/db";
import type { DecodedIdToken } from "firebase-admin/auth";

/**
 * Ensures a `users` row exists for this Firebase account and refreshes profile fields.
 */
export async function upsertUserFromFirebaseToken(
  decoded: DecodedIdToken,
): Promise<{
  id: string;
  firebaseUid: string;
  email: string | null;
  displayName: string | null;
}> {
  const uid = decoded.uid;
  const email = decoded.email ?? null;
  const displayName = decoded.name ?? null;

  const db = getDb();
  const [row] = await db
    .insert(users)
    .values({
      firebaseUid: uid,
      email,
      displayName,
    })
    .onConflictDoUpdate({
      target: users.firebaseUid,
      set: {
        email,
        displayName,
      },
    })
    .returning({
      id: users.id,
      firebaseUid: users.firebaseUid,
      email: users.email,
      displayName: users.displayName,
    });

  if (!row) {
    throw new Error("Failed to upsert user");
  }

  return row;
}
