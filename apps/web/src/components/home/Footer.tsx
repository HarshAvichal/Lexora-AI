import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-zinc-400">
          <Sparkles className="h-5 w-5 text-violet-400" aria-hidden />
          <span className="font-display font-semibold text-zinc-300">Lexora</span>
        </Link>
        <p className="text-center text-sm text-zinc-600 sm:text-right">
          Video intelligence · Built with Next.js, Express, Postgres, Qdrant & Ollama
        </p>
      </div>
    </footer>
  );
}
