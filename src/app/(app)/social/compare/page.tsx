import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { assertSocialAuditAccess, ForbiddenError } from "@/lib/rbac";
import {
  globalDataLastRefreshedAt,
  loadClubsWithLatest,
} from "@/lib/social-data";
import { CHANNEL_LABEL, SOCIAL_CHANNELS } from "@/lib/social";
import {
  ChannelCell,
  ErCaption,
  LastRefreshedBadge,
  SocialNav,
} from "@/components/social/SocialShared";
import { cn } from "@/lib/utils";

export default async function SocialComparePage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  try {
    await assertSocialAuditAccess(session);
  } catch (e) {
    if (e instanceof ForbiddenError) redirect("/w");
    throw e;
  }

  const sp = await searchParams;
  const channelFilter =
    SOCIAL_CHANNELS.find((c) => c === sp.channel) ?? null;

  const clubs = await loadClubsWithLatest();
  const dataLastRefreshedAt = await globalDataLastRefreshedAt();
  const channels = channelFilter ? [channelFilter] : SOCIAL_CHANNELS;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-wider text-navy">
            Competitive matrix
          </h1>
          <div className="mt-2">
            <LastRefreshedBadge at={dataLastRefreshedAt} />
          </div>
        </div>
        <SocialNav active="compare" />
      </div>

      <ErCaption />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/social/compare"
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-display tracking-wider border",
            !channelFilter
              ? "bg-sky text-white border-sky"
              : "border-input hover:bg-muted"
          )}
        >
          All channels
        </Link>
        {SOCIAL_CHANNELS.map((ch) => (
          <Link
            key={ch}
            href={`/social/compare?channel=${ch}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-display tracking-wider border",
              channelFilter === ch
                ? "bg-sky text-white border-sky"
                : "border-input hover:bg-muted"
            )}
          >
            {CHANNEL_LABEL[ch]}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-navy text-white">
            <tr>
              <th className="text-left font-display tracking-wider text-xs px-3 py-3">
                Club
              </th>
              {channels.map((ch) => (
                <th
                  key={ch}
                  className="text-left font-display tracking-wider text-xs px-3 py-3"
                >
                  {CHANNEL_LABEL[ch]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clubs.map((club) => (
              <tr
                key={club.id}
                className={cn(
                  "border-t",
                  club.isHangtuah ? "bg-fight/5" : "hover:bg-muted/40"
                )}
              >
                <td className="px-3 py-3 align-top">
                  <Link
                    href={`/social/clubs/${club.slug}`}
                    className={cn(
                      "hover:underline",
                      club.isHangtuah && "font-semibold text-fight"
                    )}
                  >
                    {club.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {club.city}
                  </div>
                </td>
                {channels.map((ch) => (
                  <td key={ch} className="px-3 py-3 align-top">
                    <ChannelCell club={club} channel={ch} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Cells older than 30 days show a stale stamp with that channel&apos;s
        capturedAt.
      </p>
    </div>
  );
}
