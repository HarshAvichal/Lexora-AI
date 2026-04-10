"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { ChevronDown, ChevronUp, LogOut, Sparkles, User } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { VideoIngestCard } from "@/components/dashboard/VideoIngestCard";
import { VideoLibrary } from "@/components/dashboard/VideoLibrary";
import { VideoSearchCard } from "@/components/dashboard/VideoSearchCard";
import { fetchMe, fetchVideos, type MeResponse, type VideoDto } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(false);
  const [videos, setVideos] = useState<VideoDto[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);

  const loadVideos = useCallback(async () => {
    if (!user) return;
    setVideosLoading(true);
    setVideosError(null);
    try {
      const token = await user.getIdToken();
      const list = await fetchVideos(token);
      setVideos(list);
    } catch (e) {
      setVideosError(e instanceof Error ? e.message : "Could not load videos.");
    } finally {
      setVideosLoading(false);
    }
  }, [user]);

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

  useEffect(() => {
    void loadVideos();
  }, [loadVideos]);

  async function logout() {
    await signOut(getFirebaseAuth());
    router.replace("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lexora-void text-zinc-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-violet-500/25" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-lexora-void">
      <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-lexora-void/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
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
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-violet-400/90">
              <Sparkles className="h-4 w-4" aria-hidden />
              Workspace
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-2 max-w-xl text-zinc-500">
              Ingest YouTube videos, search transcripts, ask questions with cited answers, and open
              the exact moment on YouTube.
            </p>
          </div>
        </div>

        {videosError ? (
          <div
            className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3 text-sm text-amber-200"
            role="alert"
          >
            {videosError}
            <button
              type="button"
              onClick={() => void loadVideos()}
              className="ml-3 font-medium text-amber-100 underline decoration-amber-500/50 hover:decoration-amber-300"
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-start">
          <VideoIngestCard user={user} onIngestFinished={loadVideos} />
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.08] bg-lexora-surface/40 p-5">
              <button
                type="button"
                onClick={() => setAccountOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                  <User className="h-4 w-4 text-violet-400" aria-hidden />
                  Account &amp; API
                </span>
                {accountOpen ? (
                  <ChevronUp className="h-4 w-4 text-zinc-500" aria-hidden />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-500" aria-hidden />
                )}
              </button>
              {accountOpen ? (
                <div className="mt-4 space-y-4 border-t border-white/[0.06] pt-4">
                  <dl className="space-y-2 text-sm">
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-zinc-500">Email</dt>
                      <dd className="text-white">{user.email ?? "—"}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-zinc-500">UID</dt>
                      <dd className="break-all font-mono text-xs text-zinc-500">{user.uid}</dd>
                    </div>
                  </dl>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400/80">
                      GET /v1/me
                    </p>
                    {meLoading ? (
                      <p className="mt-2 text-sm text-zinc-500">Loading…</p>
                    ) : meError ? (
                      <p className="mt-2 text-sm text-amber-400">{meError}</p>
                    ) : me ? (
                      <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] leading-relaxed text-zinc-400">
                        {JSON.stringify(me, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                  <p className="text-xs text-zinc-600">
                    API:{" "}
                    <code className="rounded bg-black/40 px-1 text-zinc-500">
                      {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}
                    </code>
                  </p>
                </div>
              ) : null}
            </div>
            <p className="px-1 text-center text-xs text-zinc-600 lg:text-left">
              Run{" "}
              <code className="rounded bg-black/30 px-1 text-zinc-500">npm run dev:worker</code>{" "}
              for ingestion. Ensure Docker has Qdrant + Ollama and pull{" "}
              <code className="rounded bg-black/30 px-1 text-zinc-500">nomic-embed-text</code> (see
              README).
            </p>
          </div>
        </div>

        <div className="mt-12">
          <VideoSearchCard user={user} videos={videos} />
        </div>

        <div className="mt-12">
          <VideoLibrary
            videos={videos}
            loading={videosLoading}
            onRefresh={() => void loadVideos()}
          />
        </div>

        <Link
          href="/"
          className="mt-12 inline-flex text-sm font-medium text-violet-400/90 hover:text-violet-300"
        >
          ← Back to home
        </Link>
      </main>
    </div>
  );
}
