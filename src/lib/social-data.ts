import { prisma } from "@/lib/prisma";
import { maxCapturedAt, type LatestSnapshot } from "@/lib/social";
import type { AudienceProfile, Club, SocialAccount } from "@prisma/client";

export type AccountWithLatest = SocialAccount & {
  latestSnapshot: LatestSnapshot | null;
  audience: AudienceProfile | null;
  snapshots?: LatestSnapshot[];
};

export type ClubWithAccounts = Club & {
  accounts: AccountWithLatest[];
  dataLastRefreshedAt: Date | null;
};

function pickLatest(
  snapshots: LatestSnapshot[]
): LatestSnapshot | null {
  if (!snapshots.length) return null;
  return [...snapshots].sort(
    (a, b) => b.capturedAt.getTime() - a.capturedAt.getTime()
  )[0];
}

export async function loadClubsWithLatest(opts?: {
  slug?: string;
  includeHistory?: boolean;
}): Promise<ClubWithAccounts[]> {
  const clubs = await prisma.club.findMany({
    where: {
      active: true,
      ...(opts?.slug ? { slug: opts.slug } : {}),
    },
    orderBy: [{ isHangtuah: "desc" }, { name: "asc" }],
    include: {
      accounts: {
        include: {
          audience: true,
          snapshots: {
            orderBy: { capturedAt: "desc" },
            ...(opts?.includeHistory ? {} : { take: 1 }),
          },
        },
      },
    },
  });

  return clubs.map((club) => {
    const accounts: AccountWithLatest[] = club.accounts.map((acc) => {
      const snaps = acc.snapshots as LatestSnapshot[];
      const latest = pickLatest(snaps);
      return {
        ...acc,
        latestSnapshot: latest,
        audience: acc.audience,
        ...(opts?.includeHistory ? { snapshots: snaps } : {}),
      };
    });
    const dataLastRefreshedAt = maxCapturedAt(
      accounts
        .filter((a) => !a.missing)
        .map((a) => a.latestSnapshot?.capturedAt)
    );
    return { ...club, accounts, dataLastRefreshedAt };
  });
}

export async function globalDataLastRefreshedAt(): Promise<Date | null> {
  const row = await prisma.metricSnapshot.findFirst({
    orderBy: { capturedAt: "desc" },
    select: { capturedAt: true },
  });
  return row?.capturedAt ?? null;
}
