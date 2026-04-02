export type LexoraRequestUser = {
  id: string;
  firebaseUid: string;
  email: string | null;
  displayName: string | null;
};

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth` after Firebase verification + DB upsert. */
      lexoraUser?: LexoraRequestUser;
    }
  }
}

export {};
