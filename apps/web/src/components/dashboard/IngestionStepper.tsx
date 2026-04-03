"use client";

import { Check, Circle, Loader2, XCircle } from "lucide-react";

const STEPS: { status: string; label: string }[] = [
  { status: "queued", label: "Queued" },
  { status: "resolving", label: "Video info" },
  { status: "fetching_transcript", label: "Transcript" },
  { status: "chunking", label: "Chunking" },
  { status: "embedding", label: "Embeddings" },
  { status: "indexing", label: "Index" },
];

function stepIndex(status: string): number {
  if (status === "completed") return STEPS.length;
  const i = STEPS.findIndex((s) => s.status === status);
  return i >= 0 ? i : 0;
}

type Props = {
  status: string;
  errorMessage: string | null;
};

export function IngestionStepper({ status, errorMessage }: Props) {
  if (status === "failed") {
    return (
      <div
        className="rounded-xl border border-red-500/25 bg-red-500/[0.08] p-4"
        role="alert"
      >
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden />
          <div>
            <p className="font-medium text-red-200">Ingestion failed</p>
            {errorMessage ? (
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{errorMessage}</p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const current = stepIndex(status);
  const done = status === "completed";

  return (
    <ol className="space-y-0">
      {STEPS.map((step, i) => {
        const isComplete = done || i < current;
        const isCurrent = !done && i === current;
        return (
          <li key={step.status}>
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                    isComplete
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                      : isCurrent
                        ? "border-violet-500/60 bg-violet-500/15 text-violet-200"
                        : "border-white/10 bg-white/[0.03] text-zinc-600"
                  }`}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Circle className="h-3.5 w-3.5" aria-hidden />
                  )}
                </span>
                {i < STEPS.length - 1 ? (
                  <span
                    className={`my-1 h-6 w-px ${
                      isComplete ? "bg-emerald-500/30" : "bg-white/[0.08]"
                    }`}
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className="pb-6 pt-1">
                <p
                  className={`text-sm font-medium ${
                    isComplete
                      ? "text-emerald-200/90"
                      : isCurrent
                        ? "text-white"
                        : "text-zinc-600"
                  }`}
                >
                  {step.label}
                </p>
                {isCurrent ? (
                  <p className="mt-0.5 text-xs text-zinc-500">In progress…</p>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
      {done ? (
        <li className="flex items-center gap-3 pl-11">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/50 bg-emerald-500/15 text-emerald-300">
            <Check className="h-4 w-4" aria-hidden />
          </span>
          <p className="text-sm font-medium text-emerald-200/90">Ready to search</p>
        </li>
      ) : null}
    </ol>
  );
}
