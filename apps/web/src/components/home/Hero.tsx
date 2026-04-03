import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundSize: "64px 64px",
          backgroundImage: `linear-gradient(to bottom, transparent 0%, rgb(5 5 8) 90%),
            linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)`,
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-violet-200/90">
          <Play className="h-3.5 w-3.5" aria-hidden />
          Video intelligence, production-ready
        </p>

        <h1 className="font-display max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Ask your videos{" "}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
            anything
          </span>
          . Get answers with timestamps.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
          Ingest YouTube and playlists, embed transcripts, and query with semantic
          search—built for courses, research, and creators who need citations, not
          guesswork.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-violet-500/30 transition hover:from-violet-500 hover:to-violet-400"
          >
            Start free
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-8 py-4 text-base font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            I have an account
          </Link>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            { k: "Transcripts → vectors", v: "Chunked, timestamped, searchable" },
            { k: "Multi-video ready", v: "Schema designed for playlists & compare" },
            { k: "Your stack", v: "Next.js · Express · Postgres · Qdrant · Ollama" },
          ].map((item) => (
            <div
              key={item.k}
              className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.05] to-transparent p-5"
            >
              <p className="text-sm font-semibold text-white">{item.k}</p>
              <p className="mt-1 text-sm text-zinc-500">{item.v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
