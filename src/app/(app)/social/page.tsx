import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { assertSocialAuditAccess, ForbiddenError } from "@/lib/rbac";
import {
  globalDataLastRefreshedAt,
  loadClubsWithLatest,
} from "@/lib/social-data";
import {
  CHANNEL_LABEL,
  SOCIAL_CHANNELS,
  formatEr,
  formatFollowers,
} from "@/lib/social";
import {
  ErCaption,
  LastRefreshedBadge,
  SocialNav,
  clubFollowerTotal,
} from "@/components/social/SocialShared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SocialOverviewPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  try {
    await assertSocialAuditAccess(session);
  } catch (e) {
    if (e instanceof ForbiddenError) redirect("/w");
    throw e;
  }

  const clubs = await loadClubsWithLatest();
  const dataLastRefreshedAt = await globalDataLastRefreshedAt();
  const hangtuah = clubs.find((c) => c.isHangtuah);
  const ranked = [...clubs]
    .map((c) => ({ club: c, total: clubFollowerTotal(c) }))
    .sort((a, b) => b.total - a.total);
  const hangRank =
    hangtuah != null
      ? ranked.findIndex((r) => r.club.id === hangtuah.id) + 1
      : null;
  const maxTotal = ranked[0]?.total || 1;

  const insights: string[] = [];
  if (hangtuah) {
    const ig = hangtuah.accounts.find((a) => a.channel === "INSTAGRAM");
    const topIg = clubs
      .map((c) => ({
        name: c.name,
        followers:
          c.accounts.find((a) => a.channel === "INSTAGRAM")?.latestSnapshot
            ?.followers ?? 0,
      }))
      .sort((a, b) => b.followers - a.followers)[0];
    const ourIg = ig?.latestSnapshot?.followers ?? 0;
    if (topIg && topIg.followers > ourIg) {
      insights.push(
        `Instagram trail: ${formatFollowers(ourIg)} vs league-leading ${topIg.name} at ${formatFollowers(topIg.followers)}.`
      );
    }
    const ourEr = ig?.latestSnapshot?.engagementRate;
    const erValues = clubs
      .map(
        (c) =>
          c.accounts.find((a) => a.channel === "INSTAGRAM")?.latestSnapshot
            ?.engagementRate
      )
      .filter((n): n is number => typeof n === "number");
    const avgEr =
      erValues.length > 0
        ? erValues.reduce((s, n) => s + n, 0) / erValues.length
        : 0;
    if (ourEr != null && ourEr >= avgEr) {
      insights.push(
        `Hang Tuah IG engagement (${formatEr(ourEr)}) is at or above the IBL sample average (${formatEr(avgEr)}).`
      );
    } else if (ourEr != null) {
      insights.push(
        `Hang Tuah IG engagement (${formatEr(ourEr)}) sits below the IBL sample average (${formatEr(avgEr)}) — prioritize content that earns comments.`
      );
    }
    const missing = hangtuah.accounts.filter((a) => a.missing);
    if (missing.length) {
      insights.push(
        `Missing Hang Tuah channels: ${missing.map((m) => CHANNEL_LABEL[m.channel]).join(", ")}.`
      );
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-wider text-navy">
            Social Audit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hang Tuah vs IBL clubs · IG · TikTok · X · YouTube
          </p>
          <div className="mt-2">
            <LastRefreshedBadge at={dataLastRefreshedAt} />
          </div>
        </div>
        <SocialNav active="overview" />
      </div>

      <ErCaption />

      {hangtuah ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-sm tracking-[0.2em] text-sky uppercase">
              Hang Tuah scorecard
            </h2>
            <Link
              href={`/social/clubs/${hangtuah.slug}`}
              className="text-sm text-sky hover:underline"
            >
              Open club →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SOCIAL_CHANNELS.map((ch) => {
              const acc = hangtuah.accounts.find((a) => a.channel === ch);
              const snap = acc?.latestSnapshot;
              return (
                <Card key={ch}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {CHANNEL_LABEL[ch]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {acc?.missing || !snap ? (
                      <p className="text-muted-foreground text-sm">—</p>
                    ) : (
                      <>
                        <p className="text-2xl font-semibold text-navy">
                          {formatFollowers(snap.followers)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          ER {formatEr(snap.engagementRate)}
                        </p>
                        <LastRefreshedBadge
                          at={snap.capturedAt}
                          label="As of"
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Card>
            <CardContent className="pt-6 space-y-2">
              <p className="text-sm">
                <span className="font-medium">League rank (sum of followers across channels):</span>{" "}
                {hangRank != null ? `#${hangRank} of ${ranked.length}` : "—"}{" "}
                · {formatFollowers(clubFollowerTotal(hangtuah))} total
              </p>
              {insights.map((t) => (
                <p key={t} className="text-sm text-muted-foreground">
                  · {t}
                </p>
              ))}
            </CardContent>
          </Card>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          No Hang Tuah club seeded yet. Run{" "}
          <code className="text-xs">npm run db:seed-social</code>.
        </p>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-sm tracking-[0.2em] text-sky uppercase">
          League follower share
        </h2>
        <div className="space-y-3">
          {ranked.map(({ club, total }, i) => (
            <Link
              key={club.id}
              href={`/social/clubs/${club.slug}`}
              className="block group"
            >
              <div className="flex items-center gap-3 text-sm mb-1">
                <span className="w-6 text-muted-foreground">#{i + 1}</span>
                <span
                  className={
                    club.isHangtuah
                      ? "font-semibold text-fight"
                      : "font-medium group-hover:text-sky"
                  }
                >
                  {club.name}
                </span>
                <span className="ml-auto text-muted-foreground">
                  {formatFollowers(total)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={
                    club.isHangtuah ? "h-full bg-fight" : "h-full bg-sky"
                  }
                  style={{ width: `${Math.max(4, (total / maxTotal) * 100)}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
