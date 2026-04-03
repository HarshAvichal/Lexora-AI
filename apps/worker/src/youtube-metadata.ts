/**
 * Public oEmbed endpoint — no API key. Best-effort title / channel for the video row.
 */
export async function fetchYouTubeOEmbed(youtubeVideoId: string): Promise<{
  title: string | null;
  authorName: string | null;
} | null> {
  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(youtubeVideoId)}`;
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string; author_name?: string };
    return {
      title: typeof data.title === "string" ? data.title : null,
      authorName: typeof data.author_name === "string" ? data.author_name : null,
    };
  } catch {
    return null;
  }
}
