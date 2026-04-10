"use client";

import { useRef, useState } from "react";
import {
  Copy,
  Download,
  ExternalLink,
  Loader2,
  MessageCircle,
  Search,
  Share2,
} from "lucide-react";
import type { User } from "firebase/auth";
import type { AskResponse, SearchResultItem, VideoDto } from "@/lib/api";
import { ragAskStream, semanticSearch } from "@/lib/api";
import {
  buildAskMarkdown,
  copyTextToClipboard,
  downloadMarkdownFile,
  shareAskMarkdown,
} from "@/lib/qa-export";

function formatTimestampMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function youtubeAtSeconds(youtubeVideoId: string, startMs: number): string {
  const t = Math.max(0, Math.floor(startMs / 1000));
  return `https://www.youtube.com/watch?v=${encodeURIComponent(youtubeVideoId)}&t=${t}s`;
}

type Mode = "search" | "ask";

type Props = {
  user: User;
  videos: VideoDto[];
};

export function VideoSearchCard({ user, videos }: Props) {
  const [mode, setMode] = useState<Mode>("ask");
  const [query, setQuery] = useState("");
  const [videoId, setVideoId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [askOut, setAskOut] = useState<AskResponse | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [exportHint, setExportHint] = useState<string | null>(null);
  const exportHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flashExportHint(message: string) {
    if (exportHintTimer.current) clearTimeout(exportHintTimer.current);
    setExportHint(message);
    exportHintTimer.current = setTimeout(() => {
      setExportHint(null);
      exportHintTimer.current = null;
    }, 2200);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setResults(null);
    setAskOut(null);
    setStreaming(false);
    setExportHint(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setAskOut(null);
    try {
      const token = await user.getIdToken();
      if (mode === "search") {
        const hits = await semanticSearch(token, {
          query: q,
          ...(videoId ? { videoId } : {}),
          limit: 10,
        });
        setResults(hits);
      } else {
        setAskOut({ answer: "", citations: [] });
        setStreaming(true);
        let streamError: string | null = null;
        await ragAskStream(
          token,
          {
            query: q,
            ...(videoId ? { videoId } : {}),
            limit: 12,
          },
          (ev) => {
            if (ev.type === "citations") {
              setAskOut((prev) => ({
                answer: prev?.answer ?? "",
                citations: ev.citations,
              }));
            } else if (ev.type === "delta") {
              setAskOut((prev) => ({
                answer: (prev?.answer ?? "") + ev.text,
                citations: prev?.citations ?? [],
              }));
            } else if (ev.type === "error") {
              streamError = ev.message || "Ask failed.";
            }
          },
        );
        if (streamError) {
          setAskOut(null);
          setError(streamError);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
      setAskOut(null);
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  }

  function slugForFilename(text: string): string {
    const s = text
      .trim()
      .slice(0, 48)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return s || "ask";
  }

  async function onCopyMarkdown() {
    if (!askOut) return;
    const md = buildAskMarkdown(query, askOut.answer, askOut.citations);
    try {
      await copyTextToClipboard(md);
      flashExportHint("Markdown copied.");
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  function onDownloadMarkdown() {
    if (!askOut) return;
    const md = buildAskMarkdown(query, askOut.answer, askOut.citations);
    const name = `lexora-${slugForFilename(query)}.md`;
    downloadMarkdownFile(name, md);
    flashExportHint("Download started.");
  }

  async function onShareMarkdown() {
    if (!askOut) return;
    const md = buildAskMarkdown(query, askOut.answer, askOut.citations);
    try {
      await shareAskMarkdown("Lexora answer", md);
    } catch (e) {
      if (
        e &&
        typeof e === "object" &&
        "name" in e &&
        (e as { name: string }).name === "AbortError"
      ) {
        return;
      }
      const msg = e instanceof Error ? e.message : "Share failed.";
      if (!msg.includes("not supported")) {
        setError(msg);
      } else {
        flashExportHint("Use Copy or Download on this device.");
      }
    }
  }

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-lexora-surface/60 p-6 backdrop-blur-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600/30 to-violet-600/25 text-cyan-100">
            {mode === "search" ? (
              <Search className="h-5 w-5" aria-hidden />
            ) : (
              <MessageCircle className="h-5 w-5" aria-hidden />
            )}
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold text-white">Search &amp; ask</h2>
            <p className="mt-1 text-sm text-zinc-500">
              <strong className="text-zinc-400">Ask</strong> uses retrieved transcript excerpts and
              Ollama chat to answer with <strong className="text-zinc-400">[1] [2]</strong> citations.
              <strong className="text-zinc-400"> Search</strong> shows raw semantic hits. For answers that
            stay on <strong className="text-zinc-400">one recording only</strong>, choose that video
            under Scope.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 rounded-lg border border-white/[0.08] bg-black/30 p-1">
          <button
            type="button"
            onClick={() => switchMode("ask")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              mode === "ask"
                ? "bg-violet-600/40 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Ask
          </button>
          <button
            type="button"
            onClick={() => switchMode("search")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              mode === "search"
                ? "bg-cyan-600/35 text-cyan-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Search
          </button>
        </div>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <label htmlFor="search-q" className="sr-only">
            Query
          </label>
          <input
            id="search-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === "ask"
                ? "What happens in the video when…?"
                : "Keywords or natural language…"
            }
            className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
          />
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="search-video" className="text-xs text-zinc-500">
              Scope
            </label>
            <select
              id="search-video"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              className="max-w-full rounded-lg border border-white/[0.1] bg-black/40 px-3 py-2 text-xs text-zinc-200 focus:border-violet-500/40 focus:outline-none"
            >
              <option value="">All your videos</option>
              {videos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title ?? v.youtubeVideoId}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
            mode === "ask"
              ? "border border-violet-500/45 bg-violet-600/20 text-violet-100 hover:bg-violet-600/30"
              : "border border-cyan-500/40 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {mode === "ask"
                ? streaming && askOut?.answer
                  ? "Answering…"
                  : "Thinking…"
                : "Searching…"}
            </>
          ) : mode === "ask" ? (
            <>
              <MessageCircle className="h-4 w-4" aria-hidden />
              Get answer
            </>
          ) : (
            <>
              <Search className="h-4 w-4" aria-hidden />
              Search
            </>
          )}
        </button>
      </form>

      {error ? (
        <p className="mt-4 text-sm text-amber-400" role="alert">
          {error}
        </p>
      ) : null}

      {askOut ? (
        <div className="mt-8 border-t border-white/[0.06] pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-400/90">Answer</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void onCopyMarkdown()}
                disabled={loading || !askOut.answer.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-black/30 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-violet-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden />
                Copy markdown
              </button>
              <button
                type="button"
                onClick={onDownloadMarkdown}
                disabled={loading || !askOut.answer.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-black/30 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-violet-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                Download .md
              </button>
              <button
                type="button"
                onClick={() => void onShareMarkdown()}
                disabled={loading || !askOut.answer.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-black/30 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-violet-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Share2 className="h-3.5 w-3.5" aria-hidden />
                Share
              </button>
            </div>
          </div>
          {exportHint ? (
            <p className="mt-2 text-xs text-emerald-400/90" role="status">
              {exportHint}
            </p>
          ) : null}
          <div className="mt-3 whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-black/30 p-4 text-sm leading-relaxed text-zinc-200">
            {askOut.answer || (streaming ? "…" : "")}
            {streaming && askOut.answer ? (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-violet-400/80 align-middle" />
            ) : null}
          </div>

          {askOut.citations.length > 0 ? (
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Sources</p>
              <ul className="mt-3 space-y-3">
                {askOut.citations.map((c) => (
                  <li key={c.chunkId}>
                    <article className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-violet-300">[{c.index}]</span>
                        <a
                          href={youtubeAtSeconds(c.youtubeVideoId, c.startMs)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300"
                        >
                          {c.videoTitle ?? "Video"} · {formatTimestampMs(c.startMs)}
                          <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-500">{c.excerpt}</p>
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {results !== null ? (
        <div className="mt-8 border-t border-white/[0.06] pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {results.length} result{results.length === 1 ? "" : "s"}
          </p>
          {results.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No matches. Try different wording or ingest a video first.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {results.map((r) => (
                <li key={r.chunkId}>
                  <article className="rounded-xl border border-white/[0.06] bg-black/25 p-4 transition hover:border-cyan-500/20">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium text-zinc-400">
                        {(r.videoTitle ?? "Video") + " · "}
                        <span className="text-cyan-400/90">
                          {formatTimestampMs(r.startMs)} – {formatTimestampMs(r.endMs)}
                        </span>
                        <span className="ml-2 text-zinc-600">
                          score {(r.score * 100).toFixed(1)}%
                        </span>
                      </p>
                      <a
                        href={youtubeAtSeconds(r.youtubeVideoId, r.startMs)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300"
                      >
                        YouTube
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-200">{r.chunkText}</p>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
