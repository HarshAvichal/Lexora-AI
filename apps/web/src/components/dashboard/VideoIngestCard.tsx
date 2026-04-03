"use client";

import { useEffect, useState } from "react";
import { Clapperboard, Link2, Loader2, X } from "lucide-react";
import type { User } from "firebase/auth";
import type { IngestionJobDto, VideoDto } from "@/lib/api";
import { fetchIngestionJob, submitVideo } from "@/lib/api";
import { IngestionStepper } from "./IngestionStepper";

const TERMINAL = new Set(["completed", "failed"]);

type Props = {
  user: User;
  onIngestFinished: () => void;
};

export function VideoIngestCard({ user, onIngestFinished }: Props) {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [trackedJob, setTrackedJob] = useState<IngestionJobDto | null>(null);
  const [lastVideo, setLastVideo] = useState<VideoDto | null>(null);

  useEffect(() => {
    if (!trackingId) return;

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    const tick = async () => {
      try {
        const token = await user.getIdToken();
        const j = await fetchIngestionJob(token, trackingId);
        if (cancelled) return;
        setTrackedJob(j);
        if (TERMINAL.has(j.status)) {
          if (interval) clearInterval(interval);
          interval = undefined;
          onIngestFinished();
        }
      } catch {
        /* next tick */
      }
    };

    void tick();
    interval = setInterval(tick, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [trackingId, user, onIngestFinished]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const source = url.trim();
    if (!source || submitting) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = await user.getIdToken();
      const { video, job } = await submitVideo(token, source);
      setLastVideo(video);
      setTrackedJob(job);
      setTrackingId(job.id);
      setUrl("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not start ingestion.");
    } finally {
      setSubmitting(false);
    }
  }

  function clearStatus() {
    setTrackingId(null);
    setTrackedJob(null);
    setLastVideo(null);
  }

  const showStatusPanel = trackedJob !== null;
  const isTerminal = trackedJob ? TERMINAL.has(trackedJob.status) : false;

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-lexora-surface/60 p-6 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/40 to-cyan-500/20 text-violet-100">
          <Clapperboard className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold text-white">Add a video</h2>
          <p className="mt-1 text-sm text-zinc-500">
            YouTube URL or 11-character video ID. We&apos;ll queue ingestion on the worker.
          </p>
        </div>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
        <div>
          <label htmlFor="yt-source" className="sr-only">
            YouTube URL or ID
          </label>
          <div className="relative">
            <Link2
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              aria-hidden
            />
            <input
              id="yt-source"
              type="text"
              inputMode="url"
              autoComplete="off"
              placeholder="https://www.youtube.com/watch?v=…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl border border-white/[0.1] bg-black/30 py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            />
          </div>
        </div>

        {submitError ? (
          <p className="text-sm text-amber-400" role="alert">
            {submitError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || !url.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:from-violet-500 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-[160px]"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Queuing…
            </>
          ) : (
            "Ingest video"
          )}
        </button>
      </form>

      {showStatusPanel && trackedJob ? (
        <div className="mt-8 border-t border-white/[0.06] pt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400/90">
              Ingestion status
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  trackedJob.status === "completed"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : trackedJob.status === "failed"
                      ? "bg-red-500/15 text-red-300"
                      : "bg-violet-500/15 text-violet-200"
                }`}
              >
                {trackedJob.status.replace(/_/g, " ")}
              </span>
              {isTerminal ? (
                <button
                  type="button"
                  onClick={clearStatus}
                  className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-300"
                  aria-label="Dismiss status"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
          {lastVideo?.title ? (
            <p className="mt-2 truncate text-sm text-zinc-400" title={lastVideo.title}>
              {lastVideo.title}
            </p>
          ) : null}
          <div className="mt-6" aria-live="polite">
            <IngestionStepper
              status={trackedJob.status}
              errorMessage={trackedJob.errorMessage}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
