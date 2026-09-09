import Link from "next/link";
import {
  CHANNEL_LABEL,
  ER_CAPTION,
  SOCIAL_CHANNELS,
  formatEr,
  formatFollowers,
  formatLastRefreshed,
  isStale,
} from "@/lib/social";
import { cn } from "@/lib/utils";
import type { ClubWithAccounts } from "@/lib/social-data";
import type { SocialChannel } from "@prisma/client";

export function SocialNav({ active }: { active: "overview" | "compare" }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/social"
        className={cn(
          "rounded-md px-3 py-1.5 text-xs font-display tracking-wider border",
          active === "overview"
            ? "bg-navy text-white border-navy"
            : "border-input hover:bg-muted"
        )}
      >
        Overview
      </Link>
      <Link
        href="/social/compare"
        className={cn(
          "rounded-md px-3 py-1.5 text-xs font-display tracking-wider border",
          active === "compare"
            ? "bg-navy text-white border-navy"
            : "border-input hover:bg-muted"
        )}
      >
        Compare
      </Link>
    </div>
  );
}

export function LastRefreshedBadge({
  at,
  label = "Data last refreshed",
}: {
  at: Date | string | null | undefined;
  label?: string;
}) {
  const text = formatLastRefreshed(at);
  if (!text) return null;
  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-medium text-foreground">{label}:</span> {text}
      {isStale(at) ? (
        <span className="ml-2 text-fight text-xs font-display tracking-wider">
          STALE
        </span>
      ) : null}
    </p>
  );
}

export function ErCaption() {
  return <p className="text-xs text-muted-foreground max-w-3xl">{ER_CAPTION}</p>;
}

export function clubFollowerTotal(club: ClubWithAccounts): number {
  return club.accounts.reduce((sum, a) => {
    if (a.missing) return sum;
    return sum + (a.latestSnapshot?.followers ?? 0);
  }, 0);
}

export function accountByChannel(
  club: ClubWithAccounts,
  channel: SocialChannel
) {
  return club.accounts.find((a) => a.channel === channel);
}

export function ChannelCell({
  club,
  channel,
}: {
  club: ClubWithAccounts;
  channel: SocialChannel;
}) {
  const acc = accountByChannel(club, channel);
  if (!acc || acc.missing) {
    return <span className="text-muted-foreground">—</span>;
  }
  const snap = acc.latestSnapshot;
  if (!snap) {
    return <span className="text-muted-foreground">no data</span>;
  }
  const stale = isStale(snap.capturedAt);
  return (
    <div className="space-y-0.5">
      <div className="font-medium">{formatFollowers(snap.followers)}</div>
      <div className="text-xs text-muted-foreground">
        ER {formatEr(snap.engagementRate)}
      </div>
      {stale ? (
        <div className="text-[10px] text-fight/80">
          stale · {formatLastRefreshed(snap.capturedAt)}
        </div>
      ) : null}
    </div>
  );
}

export { CHANNEL_LABEL, SOCIAL_CHANNELS, formatEr, formatFollowers };
