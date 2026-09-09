import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { assertSocialAuditAccess, ForbiddenError } from "@/lib/rbac";
import { loadClubsWithLatest } from "@/lib/social-data";
import {
  CHANNEL_LABEL,
  SOCIAL_CHANNELS,
  formatEr,
  formatFollowers,
  formatLastRefreshed,
} from "@/lib/social";
import {
  ErCaption,
  LastRefreshedBadge,
  SocialNav,
} from "@/components/social/SocialShared";
import {
  AudienceForm,
  ClubEditForm,
  SnapshotForm,
  SnapshotHistory,
} from "@/components/social/ClubForms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 120;
  const h = 28;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      className="mt-2 text-sky"
      aria-label="Follower trend"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={pts}
      />
    </svg>
  );
}

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  try {
    await assertSocialAuditAccess(session);
  } catch (e) {
    if (e instanceof ForbiddenError) redirect("/w");
    throw e;
  }

  const { slug } = await params;
  const clubs = await loadClubsWithLatest({ slug, includeHistory: true });
  const club = clubs[0];
  if (!club) notFound();

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/social/compare"
            className="text-xs text-sky hover:underline"
          >
            ← Compare
          </Link>
          <h1 className="font-display text-2xl tracking-wider text-navy mt-1">
            {club.name}
            {club.isHangtuah ? (
              <span className="ml-2 text-sm text-fight align-middle">
                HOME
              </span>
            ) : null}
          </h1>
          <p className="text-sm text-muted-foreground">{club.city}</p>
          <div className="mt-2">
            <LastRefreshedBadge
              at={club.dataLastRefreshedAt}
              label="Club data last refreshed"
            />
          </div>
        </div>
        <SocialNav active="compare" />
      </div>

      <ErCaption />

      <ClubEditForm
        club={{
          id: club.id,
          name: club.name,
          city: club.city,
          notes: club.notes,
          accounts: club.accounts.map((a) => ({
            channel: a.channel,
            handle: a.handle,
            missing: a.missing,
          })),
        }}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {SOCIAL_CHANNELS.map((ch) => {
          const acc = club.accounts.find((a) => a.channel === ch);
          const snap = acc?.latestSnapshot;
          const history = (acc?.snapshots ?? [])
            .map((s) => s.followers)
            .filter((n): n is number => n != null)
            .reverse();

          return (
            <Card key={ch}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                  <span>{CHANNEL_LABEL[ch]}</span>
                  {acc?.handle && !acc.missing ? (
                    <a
                      href={acc.profileUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-normal text-sky hover:underline"
                    >
                      @{acc.handle}
                    </a>
                  ) : (
                    <span className="text-xs font-normal text-muted-foreground">
                      missing
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {acc?.missing ? (
                  <p className="text-sm text-muted-foreground">
                    No account on this channel.
                  </p>
                ) : snap ? (
                  <>
                    <div>
                      <p className="text-2xl font-semibold text-navy">
                        {formatFollowers(snap.followers)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ER {formatEr(snap.engagementRate)}
                        {snap.sampleSize
                          ? ` · sample ${snap.sampleSize}`
                          : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        As of {formatLastRefreshed(snap.capturedAt)}
                      </p>
                    </div>
                    <Sparkline values={history} />
                    <SnapshotHistory snapshots={acc?.snapshots ?? []} />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No snapshots yet.
                  </p>
                )}

                {acc && !acc.missing ? (
                  <>
                    <SnapshotForm accountId={acc.id} />
                    <div className="border-t pt-3">
                      <p className="text-xs font-display tracking-wider text-muted-foreground mb-2">
                        Audience analysis
                      </p>
                      <AudienceForm
                        accountId={acc.id}
                        initial={acc.audience}
                      />
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
