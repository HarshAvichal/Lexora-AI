"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { LogOut, User } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMe, type MeResponse } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setMeLoading(true);
      setMeError(null);
      try {
        const token = await user.getIdToken();
        const data = await fetchMe(token);
        if (!cancelled) setMe(data);
      } catch (e) {
        if (!cancelled) {
          setMeError(
            e instanceof Error ? e.message : "Could not load profile from API.",
          );
        }
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function logout() {
    await signOut(getFirebaseAuth());
    router.replace("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lexora-void text-zinc-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-lexora-void">
      <div className="border-b border-white/[0.06] bg-lexora-surface/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-display text-lg font-semibold text-white">
            Lexora
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05]"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-zinc-500">
          You&apos;re signed in. Backend sync below confirms the API verified your token
          and upserted your user in Postgres.
        </p>

        <div className="mt-10 rounded-2xl border border-white/[0.08] bg-lexora-surface/60 p-6">
          <div className="flex items-center gap-3 text-violet-300">
            <User className="h-6 w-6" aria-hidden />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Firebase session
            </span>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <dt className="text-zinc-500">Email</dt>
              <dd className="text-white">{user.email ?? "—"}</dd>
            </div>
            <div className="flex flex-wrap gap-2">
              <dt className="text-zinc-500">UID</dt>
              <dd className="break-all font-mono text-xs text-zinc-400">{user.uid}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 rounded-2xl border border-white/[0.08] bg-lexora-surface/60 p-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400/90">
            API · GET /v1/me
          </p>
          {meLoading ? (
            <p className="mt-4 text-zinc-500">Loading profile from API…</p>
          ) : meError ? (
            <p className="mt-4 text-sm text-amber-400" role="alert">
              {meError}
              <span className="mt-2 block text-xs text-zinc-500">
                Is the API running at{" "}
                <code className="rounded bg-black/40 px-1 text-zinc-400">
                  {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}
                </code>{" "}
                with Firebase Admin configured?
              </span>
            </p>
          ) : me ? (
            <pre className="mt-4 overflow-x-auto rounded-xl bg-black/40 p-4 text-xs text-zinc-300">
              {JSON.stringify(me, null, 2)}
            </pre>
          ) : null}
        </div>

        <Link
          href="/"
          className="mt-8 inline-block text-sm font-medium text-violet-400 hover:text-violet-300"
        >
          ← Back to home
        </Link>
      </main>
    </div>
  );
}
