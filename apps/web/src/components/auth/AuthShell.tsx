import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  alternate,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  alternate: { href: string; label: string; linkText: string };
}) {
  return (
    <div className="relative min-h-screen bg-lexora-void">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-60" />
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-24">
        <Link
          href="/"
          className="mb-10 flex items-center gap-2 text-lg font-semibold text-white"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-lg shadow-violet-500/30">
            <Sparkles className="h-5 w-5 text-white" aria-hidden />
          </span>
          <span className="font-display">Lexora</span>
        </Link>

        <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-lexora-surface/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
          <div className="mt-8 space-y-6">{children}</div>
          <p className="mt-8 text-center text-sm text-zinc-500">
            {alternate.label}{" "}
            <Link
              href={alternate.href}
              className="font-semibold text-violet-400 hover:text-violet-300"
            >
              {alternate.linkText}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
