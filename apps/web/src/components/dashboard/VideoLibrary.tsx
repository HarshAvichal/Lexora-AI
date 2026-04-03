"use client";

import { ExternalLink, Film, RefreshCw } from "lucide-react";
import type { VideoDto } from "@/lib/api";

type Props = {
  videos: VideoDto[];
  loading: boolean;
  onRefresh: () => void;
};

function thumbUrl(youtubeVideoId: string): string {
  return `https://i.ytimg.com/vi/${youtubeVideoId}/mqdefault.jpg`;
}

function watchUrl(youtubeVideoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(youtubeVideoId)}`;
}

export function VideoLibrary({ videos, loading, onRefresh }: Props) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-lexora-surface/60 p-6 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">Your videos</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Ingested in your workspace. Open on YouTube anytime.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </button>
      </div>

      {loading && videos.length === 0 ? (
        <div className="mt-10 flex justify-center py-16">
          <div className="h-10 w-10 animate-pulse rounded-full bg-violet-500/20" />
        </div>
      ) : videos.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-white/[0.1] bg-black/20 px-6 py-16 text-center">
          <Film className="mx-auto h-10 w-10 text-zinc-600" aria-hidden />
          <p className="mt-4 font-medium text-zinc-400">No videos yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-600">
            Paste a YouTube link above. Lexora will pull the transcript and chunk it for search.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {videos.map((v) => (
            <li key={v.id}>
              <article className="group flex gap-4 rounded-xl border border-white/[0.06] bg-black/25 p-3 transition hover:border-violet-500/25 hover:bg-black/35">
                <a
                  href={watchUrl(v.youtubeVideoId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative shrink-0 overflow-hidden rounded-lg outline-none ring-offset-lexora-void focus-visible:ring-2 focus-visible:ring-violet-500/60"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbUrl(v.youtubeVideoId)}
                    alt=""
                    className="h-20 w-36 object-cover transition group-hover:opacity-90"
                    width={144}
                    height={80}
                  />
                </a>
                <div className="min-w-0 flex-1 py-0.5">
                  <h3 className="line-clamp-2 font-medium leading-snug text-white">
                    {v.title ?? "Untitled video"}
                  </h3>
                  {v.channelTitle ? (
                    <p className="mt-1 truncate text-xs text-zinc-500">{v.channelTitle}</p>
                  ) : null}
                  <a
                    href={watchUrl(v.youtubeVideoId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300"
                  >
                    Open on YouTube
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
