"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const nav = [
  { href: "/#features", label: "Product" },
  { href: "/#how", label: "How it works" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-lexora-void/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2 text-lg font-semibold tracking-tight text-white"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 shadow-lg shadow-violet-500/25 transition group-hover:shadow-violet-500/40">
            <Sparkles className="h-5 w-5 text-white" aria-hidden />
          </span>
          <span className="font-display">Lexora</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!loading && user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition hover:text-white"
              >
                Dashboard
              </Link>
            </>
          ) : !loading ? (
            <>
              {!isAuthPage && (
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition hover:text-white"
                >
                  Log in
                </Link>
              )}
              <Link
                href="/signup"
                className="rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:from-violet-500 hover:to-violet-400"
              >
                Get started
              </Link>
            </>
          ) : (
            <span className="h-9 w-24 animate-pulse rounded-lg bg-zinc-800" />
          )}
        </div>
      </div>
    </header>
  );
}
