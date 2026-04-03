const base =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

export type MeResponse = {
  id: string;
  firebaseUid: string;
  email: string | null;
  displayName: string | null;
};

export type VideoDto = {
  id: string;
  youtubeVideoId: string;
  title: string | null;
  channelTitle: string | null;
  durationSeconds: number | null;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IngestionJobDto = {
  id: string;
  videoId: string;
  type: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  errorMessage: string | null;
  errorCode: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

async function readApiError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as { message?: string };
    if (typeof j.message === "string") return j.message;
  } catch {
    /* ignore */
  }
  return text || `Request failed (${res.status})`;
}

export async function fetchMe(idToken: string): Promise<MeResponse> {
  const res = await fetch(`${base}/v1/me`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return res.json() as Promise<MeResponse>;
}

export async function fetchVideos(idToken: string): Promise<VideoDto[]> {
  const res = await fetch(`${base}/v1/videos`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error(await readApiError(res));
  const data = (await res.json()) as { videos: VideoDto[] };
  return data.videos;
}

export async function fetchVideo(idToken: string, videoId: string): Promise<VideoDto> {
  const res = await fetch(`${base}/v1/videos/${encodeURIComponent(videoId)}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error(await readApiError(res));
  const data = (await res.json()) as { video: VideoDto };
  return data.video;
}

export async function submitVideo(
  idToken: string,
  source: string,
): Promise<{ video: VideoDto; job: IngestionJobDto }> {
  const res = await fetch(`${base}/v1/videos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ source }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return res.json() as Promise<{ video: VideoDto; job: IngestionJobDto }>;
}

export async function fetchIngestionJob(
  idToken: string,
  jobId: string,
): Promise<IngestionJobDto> {
  const res = await fetch(`${base}/v1/ingestion-jobs/${encodeURIComponent(jobId)}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error(await readApiError(res));
  const data = (await res.json()) as { job: IngestionJobDto };
  return data.job;
}
