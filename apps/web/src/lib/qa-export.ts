import type { AskCitation } from "@/lib/api";

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

/**
 * Markdown export for a single Ask turn, including citation list with YouTube deep links.
 */
export function buildAskMarkdown(query: string, answer: string, citations: AskCitation[]): string {
  const lines: string[] = [
    "## Question",
    "",
    query.trim(),
    "",
    "## Answer",
    "",
    answer.trim() || "_(empty)_",
    "",
  ];

  if (citations.length > 0) {
    lines.push("## Sources", "");
    for (const c of citations) {
      const title = c.videoTitle ?? "Video";
      const t0 = formatTimestampMs(c.startMs);
      const t1 = formatTimestampMs(c.endMs);
      const link = youtubeAtSeconds(c.youtubeVideoId, c.startMs);
      lines.push(`### [${c.index}] ${title} (${t0}–${t1})`);
      lines.push("");
      lines.push(`[Open in YouTube](${link})`);
      lines.push("");
      lines.push(c.excerpt);
      lines.push("");
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error("Clipboard not available");
}

export function downloadMarkdownFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function shareAskMarkdown(title: string, markdown: string): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.share) {
    throw new Error("Sharing not supported on this device");
  }

  const file = new File([markdown], "lexora-ask.md", { type: "text/markdown" });
  const canFiles =
    typeof navigator.canShare === "function" &&
    navigator.canShare({ title, text: markdown, files: [file] });

  if (canFiles) {
    await navigator.share({ title, text: markdown, files: [file] });
    return;
  }

  await navigator.share({ title, text: markdown });
}
