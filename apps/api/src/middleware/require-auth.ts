import type { NextFunction, Request, Response } from "express";
import { getFirebaseAuth } from "../lib/firebase-admin";
import { upsertUserFromFirebaseToken } from "../services/user-provisioning";

const BEARER = /^Bearer\s+(.+)$/i;

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !BEARER.test(header)) {
      res.status(401).json({ error: "unauthorized", message: "Missing Bearer token" });
      return;
    }

    const token = header.match(BEARER)?.[1];
    if (!token) {
      res.status(401).json({ error: "unauthorized", message: "Invalid Authorization header" });
      return;
    }

    let firebaseAuth;
    try {
      firebaseAuth = getFirebaseAuth();
    } catch {
      res.status(503).json({
        error: "service_unavailable",
        message: "Firebase Admin is not configured on the server",
      });
      return;
    }

    try {
      const decoded = await firebaseAuth.verifyIdToken(token);
      req.lexoraUser = await upsertUserFromFirebaseToken(decoded);
      next();
    } catch (err) {
      console.error("[requireAuth] token or user sync failed:", err);
      res.status(401).json({ error: "unauthorized", message: "Invalid or expired token" });
    }
  } catch (err) {
    console.error("[requireAuth] unexpected:", err);
    res.status(500).json({ error: "internal_error", message: "Auth middleware failed" });
  }
}
