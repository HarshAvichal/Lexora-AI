/** YouTube video IDs are 11 characters (alphanumeric, `_`, `-`). */
const YOUTUBE_VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Accepts a bare 11-char id or common YouTube / youtu.be URLs and returns the video id, or null.
 */
export function parseYouTubeVideoId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (YOUTUBE_VIDEO_ID.test(s)) return s;

  try {
    const url = new URL(s);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && YOUTUBE_VIDEO_ID.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = url.searchParams.get("v");
      if (v && YOUTUBE_VIDEO_ID.test(v)) return v;

      const parts = url.pathname.split("/").filter(Boolean);
      for (const key of ["embed", "shorts", "live"]) {
        const i = parts.indexOf(key);
        const id = i >= 0 ? parts[i + 1] : undefined;
        if (id && YOUTUBE_VIDEO_ID.test(id)) return id;
      }
    }
  } catch {
    return null;
  }

  return null;
}
