import { SocialChannel, type MetricSnapshot } from "@prisma/client";

export const SOCIAL_CHANNELS: SocialChannel[] = [
  SocialChannel.INSTAGRAM,
  SocialChannel.TIKTOK,
  SocialChannel.X,
  SocialChannel.YOUTUBE,
];

export const CHANNEL_LABEL: Record<SocialChannel, string> = {
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  X: "X",
  YOUTUBE: "YouTube",
};

export const ER_CAPTION =
  "Engagement rate (public sample): IG/TikTok/X = (avg likes + avg comments) / followers on recent posts. YouTube = avg views / subscribers on recent videos. Not the same as platform “accounts reached” ER.";

const WIB = "Asia/Jakarta";

export function formatWib(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  const absolute = new Intl.DateTimeFormat("en-GB", {
    timeZone: WIB,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${absolute} WIB`;
}

export function relativeFromNow(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  const abs = Math.abs(diffMs);
  const minutes = Math.round(abs / 60_000);
  const hours = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);
  const suffix = diffMs >= 0 ? "ago" : "from now";
  if (minutes < 60) return `${minutes} min ${suffix}`;
  if (hours < 48) return `${hours} hr ${suffix}`;
  return `${days} days ${suffix}`;
}

export function formatLastRefreshed(
  date: Date | string | null | undefined
): string | null {
  const abs = formatWib(date);
  const rel = relativeFromNow(date);
  if (!abs || !rel) return null;
  return `${abs} · ${rel}`;
}

export function isStale(
  date: Date | string | null | undefined,
  days = 30
): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() > days * 86_400_000;
}

export function formatFollowers(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

export function formatEr(rate: number | null | undefined): string {
  if (rate == null) return "—";
  return `${(rate * 100).toFixed(2)}%`;
}

export type LatestSnapshot = Pick<
  MetricSnapshot,
  | "id"
  | "capturedAt"
  | "recordedAt"
  | "followers"
  | "following"
  | "contentCount"
  | "avgLikes"
  | "avgComments"
  | "avgViews"
  | "engagementRate"
  | "sampleSize"
  | "source"
  | "notes"
>;

export function maxCapturedAt(
  dates: Array<Date | string | null | undefined>
): Date | null {
  let max: Date | null = null;
  for (const raw of dates) {
    if (!raw) continue;
    const d = typeof raw === "string" ? new Date(raw) : raw;
    if (Number.isNaN(d.getTime())) continue;
    if (!max || d > max) max = d;
  }
  return max;
}

export function profileUrlFor(
  channel: SocialChannel,
  handle: string | null | undefined
): string | null {
  if (!handle) return null;
  const h = handle.replace(/^@/, "");
  switch (channel) {
    case SocialChannel.INSTAGRAM:
      return `https://instagram.com/${h}`;
    case SocialChannel.TIKTOK:
      return `https://tiktok.com/@${h}`;
    case SocialChannel.X:
      return `https://x.com/${h}`;
    case SocialChannel.YOUTUBE:
      return handle.startsWith("http")
        ? handle
        : `https://youtube.com/@${h}`;
    default:
      return null;
  }
}
