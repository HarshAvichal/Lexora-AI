import admin from "firebase-admin";

/**
 * Initializes Firebase Admin once. Prefer either:
 * - `FIREBASE_SERVICE_ACCOUNT_JSON` — minified JSON string of the service account key, or
 * - `GOOGLE_APPLICATION_CREDENTIALS` — path to the service account JSON file.
 */
function ensureFirebaseApp(): void {
  if (admin.apps.length > 0) return;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    const cred = JSON.parse(json) as admin.ServiceAccount;
    admin.initializeApp({ credential: admin.credential.cert(cred) });
    return;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) {
    admin.initializeApp();
    return;
  }

  throw new Error(
    "Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.",
  );
}

export function getFirebaseAuth(): admin.auth.Auth {
  ensureFirebaseApp();
  return admin.auth();
}
