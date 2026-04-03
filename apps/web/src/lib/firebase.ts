import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

/**
 * Next.js replaces only *static* `process.env.NEXT_PUBLIC_*` reads at build time.
 * Dynamic `process.env[name]` stays empty in the browser — do not use that pattern.
 */
function getFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey?.trim()) {
    throw new Error(
      "Missing NEXT_PUBLIC_FIREBASE_API_KEY. Add it to apps/web/.env or .env.local and restart `npm run dev:web`.",
    );
  }
  if (!authDomain?.trim()) {
    throw new Error(
      "Missing NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN. Add it to apps/web/.env or .env.local and restart the dev server.",
    );
  }
  if (!projectId?.trim()) {
    throw new Error(
      "Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID. Add it to apps/web/.env or .env.local and restart the dev server.",
    );
  }
  if (!storageBucket?.trim()) {
    throw new Error(
      "Missing NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET. Add it to apps/web/.env or .env.local and restart the dev server.",
    );
  }
  if (!messagingSenderId?.trim()) {
    throw new Error(
      "Missing NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID. Add it to apps/web/.env or .env.local and restart the dev server.",
    );
  }
  if (!appId?.trim()) {
    throw new Error(
      "Missing NEXT_PUBLIC_FIREBASE_APP_ID. Add it to apps/web/.env or .env.local and restart the dev server.",
    );
  }

  return {
    apiKey: apiKey.trim(),
    authDomain: authDomain.trim(),
    projectId: projectId.trim(),
    storageBucket: storageBucket.trim(),
    messagingSenderId: messagingSenderId.trim(),
    appId: appId.trim(),
  };
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

/** Call only from client components / hooks. */
export function getFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase client must only be used in the browser.");
  }
  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}
