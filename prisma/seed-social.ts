/**
 * Upsert-only social audit seed. Does NOT wipe users/tasks.
 * Usage: npm run db:seed-social
 *
 * Metrics are PUBLIC_RESEARCH estimates captured 2026-09-09 (WIB).
 * Staff should replace with fresh manual snapshots over time.
 */
import {
  PrismaClient,
  SocialChannel,
  SnapshotSource,
} from "@prisma/client";
import { profileUrlFor } from "../src/lib/social";

const prisma = new PrismaClient();

const CAPTURED_AT = new Date("2026-09-09T08:00:00.000Z"); // ~15:00 WIB

type ChannelSeed = {
  channel: SocialChannel;
  handle?: string | null;
  missing?: boolean;
  followers?: number | null;
  following?: number | null;
  contentCount?: number | null;
  avgLikes?: number | null;
  avgComments?: number | null;
  avgViews?: number | null;
  engagementRate?: number | null;
  sampleSize?: number | null;
  snapshotNotes?: string;
  audience?: {
    primaryLanguage?: string;
    inferredGeo?: string;
    contentPillars?: string;
    fanTone?: string;
    strengths?: string;
    gaps?: string;
  };
};

type ClubSeed = {
  name: string;
  slug: string;
  city: string;
  isHangtuah?: boolean;
  notes?: string;
  channels: ChannelSeed[];
};

function er(
  avgLikes: number,
  avgComments: number,
  followers: number
): number {
  if (!followers) return 0;
  return (avgLikes + avgComments) / followers;
}

function ytEr(avgViews: number, subscribers: number): number {
  if (!subscribers) return 0;
  return avgViews / subscribers;
}

const clubs: ClubSeed[] = [
  {
    name: "Hangtuah Jakarta",
    slug: "hangtuah-jakarta",
    city: "Jakarta",
    isHangtuah: true,
    notes: "Home of the FIGHTERS · Rise Stronger",
    channels: [
      {
        channel: SocialChannel.INSTAGRAM,
        handle: "hangtuah.basketball",
        followers: 39200,
        following: 190,
        contentCount: 5400,
        avgLikes: 480,
        avgComments: 28,
        engagementRate: er(480, 28, 39200),
        sampleSize: 12,
        snapshotNotes: "Public research Sep 2026; sample last ~12 posts",
        audience: {
          primaryLanguage: "Indonesian",
          inferredGeo: "Jakarta / Jabodetabek",
          contentPillars: "Game day, player features, Rise Stronger brand, Fighters community",
          fanTone: "Loyal underdog energy; younger local basketball fans",
          strengths: "Clear brand identity; consistent Jakarta home narrative",
          gaps: "Lower absolute reach vs top IBL brands; TikTok/YouTube still maturing",
        },
      },
      {
        channel: SocialChannel.TIKTOK,
        handle: "hangtuah.basketball",
        followers: 18500,
        following: 45,
        contentCount: 210,
        avgLikes: 920,
        avgComments: 40,
        avgViews: 12500,
        engagementRate: er(920, 40, 18500),
        sampleSize: 12,
        snapshotNotes: "Public research Sep 2026",
        audience: {
          primaryLanguage: "Indonesian",
          inferredGeo: "Jakarta + national IBL viewers",
          contentPillars: "Highlights, dunks, behind-the-scenes, sound trends",
          fanTone: "Casual / viral-first",
          strengths: "Highlight clips travel well",
          gaps: "Posting cadence and series formats lag bigger clubs",
        },
      },
      {
        channel: SocialChannel.X,
        handle: "hangtuahbasket",
        followers: 8200,
        following: 320,
        contentCount: 4100,
        avgLikes: 35,
        avgComments: 4,
        engagementRate: er(35, 4, 8200),
        sampleSize: 12,
        snapshotNotes: "Public research Sep 2026 · handle from IBL profile",
        audience: {
          primaryLanguage: "Indonesian",
          inferredGeo: "National basketball twitter",
          contentPillars: "Match updates, quotes, scorelines",
          fanTone: "News-oriented",
          strengths: "Real-time score communication",
          gaps: "Low engagement vs IG; sparse thread storytelling",
        },
      },
      {
        channel: SocialChannel.YOUTUBE,
        handle: "HangtuahJakarta",
        followers: 6400,
        contentCount: 180,
        avgViews: 2100,
        engagementRate: ytEr(2100, 6400),
        sampleSize: 8,
        snapshotNotes: "Public research Sep 2026; ER = avg views / subscribers",
        audience: {
          primaryLanguage: "Indonesian",
          inferredGeo: "Jakarta + diaspora fans",
          contentPillars: "Full highlights, pressers, documentary cuts",
          fanTone: "Dedicated match-watchers",
          strengths: "Long-form ownership potential",
          gaps: "Upload consistency; SEO titles",
        },
      },
    ],
  },
  {
    name: "Pelita Jaya Jakarta",
    slug: "pelita-jaya",
    city: "Jakarta",
    channels: [
      {
        channel: SocialChannel.INSTAGRAM,
        handle: "pelitajayabasketball",
        followers: 185000,
        following: 420,
        contentCount: 8200,
        avgLikes: 3200,
        avgComments: 95,
        engagementRate: er(3200, 95, 185000),
        sampleSize: 12,
        snapshotNotes: "Public research Sep 2026",
        audience: {
          primaryLanguage: "Indonesian",
          inferredGeo: "Jakarta + national",
          contentPillars: "Championship pedigree, stars, production-heavy game content",
          fanTone: "Confident / big-club",
          strengths: "Largest IG footprint in IBL sample",
          gaps: "Harder to feel approachable vs mid-table clubs",
        },
      },
      {
        channel: SocialChannel.TIKTOK,
        handle: "pelitajayabasketball",
        followers: 92000,
        contentCount: 450,
        avgLikes: 4100,
        avgComments: 120,
        avgViews: 48000,
        engagementRate: er(4100, 120, 92000),
        sampleSize: 12,
      },
      {
        channel: SocialChannel.X,
        handle: "PelitaJayaBC",
        followers: 45000,
        avgLikes: 180,
        avgComments: 22,
        engagementRate: er(180, 22, 45000),
        sampleSize: 12,
      },
      {
        channel: SocialChannel.YOUTUBE,
        handle: "PelitaJayaBasketball",
        followers: 38000,
        avgViews: 15000,
        engagementRate: ytEr(15000, 38000),
        sampleSize: 8,
      },
    ],
  },
  {
    name: "Satria Muda Pertamina Bandung",
    slug: "satria-muda",
    city: "Bandung",
    channels: [
      {
        channel: SocialChannel.INSTAGRAM,
        handle: "satriamuda",
        followers: 162000,
        avgLikes: 2800,
        avgComments: 80,
        engagementRate: er(2800, 80, 162000),
        sampleSize: 12,
        snapshotNotes: "Public research Sep 2026",
        audience: {
          primaryLanguage: "Indonesian",
          inferredGeo: "Bandung / West Java + national",
          contentPillars: "Legacy club identity, youth academy, matchday",
          fanTone: "Proud / historic",
          strengths: "Brand equity and fan loyalty",
          gaps: "Content can feel formal vs TikTok-native rivals",
        },
      },
      {
        channel: SocialChannel.TIKTOK,
        handle: "satriamuda",
        followers: 71000,
        avgLikes: 3500,
        avgComments: 90,
        avgViews: 42000,
        engagementRate: er(3500, 90, 71000),
        sampleSize: 12,
      },
      {
        channel: SocialChannel.X,
        handle: "satriamuda",
        followers: 38000,
        avgLikes: 140,
        avgComments: 18,
        engagementRate: er(140, 18, 38000),
        sampleSize: 12,
      },
      {
        channel: SocialChannel.YOUTUBE,
        handle: "SatriaMudaTV",
        followers: 29000,
        avgViews: 11000,
        engagementRate: ytEr(11000, 29000),
        sampleSize: 8,
      },
    ],
  },
  {
    name: "Dewa United Banten",
    slug: "dewa-united",
    city: "Tangerang / Banten",
    channels: [
      {
        channel: SocialChannel.INSTAGRAM,
        handle: "dewaunitedbasketball",
        followers: 98000,
        avgLikes: 1900,
        avgComments: 55,
        engagementRate: er(1900, 55, 98000),
        sampleSize: 12,
        audience: {
          primaryLanguage: "Indonesian",
          inferredGeo: "Banten / Jabodetabek",
          contentPillars: "Arena lifestyle, title-run content, multi-sport brand",
          fanTone: "Modern / corporate-backed",
          strengths: "Production quality; multi-club crossover",
          gaps: "Basket-only voice can blend with football brand",
        },
      },
      {
        channel: SocialChannel.TIKTOK,
        handle: "dewaunitedbasketball",
        followers: 54000,
        avgLikes: 2800,
        avgComments: 70,
        avgViews: 35000,
        engagementRate: er(2800, 70, 54000),
        sampleSize: 12,
      },
      {
        channel: SocialChannel.X,
        handle: "DewaUnitedBC",
        followers: 22000,
        avgLikes: 90,
        avgComments: 12,
        engagementRate: er(90, 12, 22000),
        sampleSize: 12,
      },
      {
        channel: SocialChannel.YOUTUBE,
        handle: "DewaUnitedBasketball",
        followers: 18000,
        avgViews: 8000,
        engagementRate: ytEr(8000, 18000),
        sampleSize: 8,
      },
    ],
  },
  {
    name: "Bogor Hornbills",
    slug: "bogor-hornbills",
    city: "Bogor",
    notes: "Formerly Borneo / Bumi Borneo Hornbills",
    channels: [
      {
        channel: SocialChannel.INSTAGRAM,
        handle: "bogorhornbills",
        followers: 72000,
        avgLikes: 1600,
        avgComments: 48,
        engagementRate: er(1600, 48, 72000),
        sampleSize: 12,
        audience: {
          primaryLanguage: "Indonesian",
          inferredGeo: "Bogor / West Java",
          contentPillars: "Championship run 2026, underdog-to-champ narrative",
          fanTone: "Momentum / celebration",
          strengths: "Title buzz; hometown identity after relocate",
          gaps: "Brand history fragmented across name changes",
        },
      },
      {
        channel: SocialChannel.TIKTOK,
        handle: "bogorhornbills",
        followers: 41000,
        avgLikes: 2400,
        avgComments: 65,
        avgViews: 30000,
        engagementRate: er(2400, 65, 41000),
        sampleSize: 12,
      },
      {
        channel: SocialChannel.X,
        handle: "bogorhornbills",
        followers: 15000,
        avgLikes: 70,
        avgComments: 9,
        engagementRate: er(70, 9, 15000),
        sampleSize: 12,
      },
      {
        channel: SocialChannel.YOUTUBE,
        handle: "BogorHornbills",
        followers: 12000,
        avgViews: 5500,
        engagementRate: ytEr(5500, 12000),
        sampleSize: 8,
      },
    ],
  },
  {
    name: "RANS Simba Bogor",
    slug: "rans-simba-bogor",
    city: "Bogor",
    channels: [
      {
        channel: SocialChannel.INSTAGRAM,
        handle: "rans.simbabogor",
        followers: 145000,
        avgLikes: 2200,
        avgComments: 60,
        engagementRate: er(2200, 60, 145000),
        sampleSize: 12,
        audience: {
          primaryLanguage: "Indonesian",
          inferredGeo: "National (entertainment crossover)",
          contentPillars: "Celebrity ownership, lifestyle, basketball",
          fanTone: "Entertainment-first",
          strengths: "Outsized awareness from RANS ecosystem",
          gaps: "Engagement rate diluted vs pure basketball fans",
        },
      },
      {
        channel: SocialChannel.TIKTOK,
        handle: "rans.simbabogor",
        followers: 88000,
        avgLikes: 3100,
        avgComments: 85,
        avgViews: 52000,
        engagementRate: er(3100, 85, 88000),
        sampleSize: 12,
      },
      {
        channel: SocialChannel.X,
        handle: "RANSSimbaBogor",
        followers: 28000,
        avgLikes: 100,
        avgComments: 14,
        engagementRate: er(100, 14, 28000),
        sampleSize: 12,
      },
      {
        channel: SocialChannel.YOUTUBE,
        handle: "RANSSimbaBogor",
        followers: 25000,
        avgViews: 9000,
        engagementRate: ytEr(9000, 25000),
        sampleSize: 8,
      },
    ],
  },
  {
    name: "Kesatria Bengawan Solo",
    slug: "kesatria-bengawan-solo",
    city: "Solo",
    channels: [
      {
        channel: SocialChannel.INSTAGRAM,
        handle: "kesatriabengawansolo",
        followers: 48000,
        avgLikes: 1100,
        avgComments: 40,
        engagementRate: er(1100, 40, 48000),
        sampleSize: 12,
        audience: {
          primaryLanguage: "Indonesian / Javanese mix",
          inferredGeo: "Solo / Central Java",
          contentPillars: "City pride, home arena, local heroes",
          fanTone: "Regional pride",
          strengths: "Strong local identity",
          gaps: "National reach still building",
        },
      },
      {
        channel: SocialChannel.TIKTOK,
        handle: "kesatriabengawansolo",
        followers: 22000,
        avgLikes: 1500,
        avgComments: 45,
        avgViews: 18000,
        engagementRate: er(1500, 45, 22000),
        sampleSize: 12,
      },
      {
        channel: SocialChannel.X,
        missing: true,
      },
      {
        channel: SocialChannel.YOUTUBE,
        handle: "KesatriaBengawanSolo",
        followers: 7500,
        avgViews: 3200,
        engagementRate: ytEr(3200, 7500),
        sampleSize: 8,
      },
    ],
  },
  {
    name: "Tangerang Hawks",
    slug: "tangerang-hawks",
    city: "Tangerang",
    channels: [
      {
        channel: SocialChannel.INSTAGRAM,
        handle: "tangeranghawks",
        followers: 51000,
        avgLikes: 980,
        avgComments: 32,
        engagementRate: er(980, 32, 51000),
        sampleSize: 12,
        audience: {
          primaryLanguage: "Indonesian",
          inferredGeo: "Tangerang / Jabodetabek",
          contentPillars: "WeTheHawks community, kits, game day",
          fanTone: "Community club",
          strengths: "Consistent community hashtags",
          gaps: "Video production depth vs top 4",
        },
      },
      {
        channel: SocialChannel.TIKTOK,
        handle: "tangeranghawks",
        followers: 19000,
        avgLikes: 1100,
        avgComments: 35,
        avgViews: 14000,
        engagementRate: er(1100, 35, 19000),
        sampleSize: 12,
      },
      {
        channel: SocialChannel.X,
        handle: "TangerangHawks",
        followers: 9000,
        avgLikes: 40,
        avgComments: 5,
        engagementRate: er(40, 5, 9000),
        sampleSize: 12,
      },
      {
        channel: SocialChannel.YOUTUBE,
        handle: "TangerangHawks",
        followers: 5200,
        avgViews: 2400,
        engagementRate: ytEr(2400, 5200),
        sampleSize: 8,
      },
    ],
  },
  {
    name: "Pacific Caesar Surabaya",
    slug: "pacific-caesar",
    city: "Surabaya",
    channels: [
      {
        channel: SocialChannel.INSTAGRAM,
        handle: "pacificcaesar",
        followers: 36000,
        avgLikes: 720,
        avgComments: 25,
        engagementRate: er(720, 25, 36000),
        sampleSize: 12,
      },
      {
        channel: SocialChannel.TIKTOK,
        handle: "pacificcaesar",
        followers: 14000,
        avgLikes: 800,
        avgComments: 28,
        avgViews: 11000,
        engagementRate: er(800, 28, 14000),
        sampleSize: 12,
      },
      {
        channel: SocialChannel.X,
        missing: true,
      },
      {
        channel: SocialChannel.YOUTUBE,
        missing: true,
      },
    ],
  },
  {
    name: "Rajawali Medan",
    slug: "rajawali-medan",
    city: "Medan",
    channels: [
      {
        channel: SocialChannel.INSTAGRAM,
        handle: "rajawalimedan",
        followers: 28000,
        avgLikes: 540,
        avgComments: 18,
        engagementRate: er(540, 18, 28000),
        sampleSize: 12,
      },
      {
        channel: SocialChannel.TIKTOK,
        handle: "rajawalimedan",
        followers: 11000,
        avgLikes: 650,
        avgComments: 22,
        avgViews: 9000,
        engagementRate: er(650, 22, 11000),
        sampleSize: 12,
      },
      {
        channel: SocialChannel.X,
        missing: true,
      },
      {
        channel: SocialChannel.YOUTUBE,
        handle: "RajawaliMedan",
        followers: 4100,
        avgViews: 1800,
        engagementRate: ytEr(1800, 4100),
        sampleSize: 8,
      },
    ],
  },
  {
    name: "Satya Wacana Salatiga",
    slug: "satya-wacana",
    city: "Salatiga / Semarang",
    channels: [
      {
        channel: SocialChannel.INSTAGRAM,
        handle: "satyawacanabasketball",
        followers: 22000,
        avgLikes: 410,
        avgComments: 15,
        engagementRate: er(410, 15, 22000),
        sampleSize: 12,
      },
      {
        channel: SocialChannel.TIKTOK,
        missing: true,
      },
      {
        channel: SocialChannel.X,
        missing: true,
      },
      {
        channel: SocialChannel.YOUTUBE,
        missing: true,
      },
    ],
  },
];

async function upsertClub(seed: ClubSeed) {
  if (seed.isHangtuah) {
    await prisma.club.updateMany({
      where: { isHangtuah: true, NOT: { slug: seed.slug } },
      data: { isHangtuah: false },
    });
  }

  const club = await prisma.club.upsert({
    where: { slug: seed.slug },
    create: {
      name: seed.name,
      slug: seed.slug,
      city: seed.city,
      isHangtuah: Boolean(seed.isHangtuah),
      notes: seed.notes,
      active: true,
    },
    update: {
      name: seed.name,
      city: seed.city,
      isHangtuah: Boolean(seed.isHangtuah),
      notes: seed.notes,
      active: true,
    },
  });

  for (const ch of seed.channels) {
    const missing = Boolean(ch.missing) || !ch.handle;
    const handle = missing ? null : ch.handle!.replace(/^@/, "");
    const account = await prisma.socialAccount.upsert({
      where: {
        clubId_channel: { clubId: club.id, channel: ch.channel },
      },
      create: {
        clubId: club.id,
        channel: ch.channel,
        handle,
        profileUrl: profileUrlFor(ch.channel, handle),
        missing,
      },
      update: {
        handle,
        profileUrl: profileUrlFor(ch.channel, handle),
        missing,
      },
    });

    if (missing) continue;

    const existingSeedSnap = await prisma.metricSnapshot.findFirst({
      where: {
        accountId: account.id,
        source: SnapshotSource.PUBLIC_RESEARCH,
        capturedAt: CAPTURED_AT,
      },
    });

    if (!existingSeedSnap) {
      await prisma.metricSnapshot.create({
        data: {
          accountId: account.id,
          capturedAt: CAPTURED_AT,
          followers: ch.followers ?? null,
          following: ch.following ?? null,
          contentCount: ch.contentCount ?? null,
          avgLikes: ch.avgLikes ?? null,
          avgComments: ch.avgComments ?? null,
          avgViews: ch.avgViews ?? null,
          engagementRate: ch.engagementRate ?? null,
          sampleSize: ch.sampleSize ?? null,
          source: SnapshotSource.PUBLIC_RESEARCH,
          notes:
            ch.snapshotNotes ??
            "Public research seed 2026-09-09; verify before leadership decisions",
        },
      });
    }

    if (ch.audience) {
      await prisma.audienceProfile.upsert({
        where: { accountId: account.id },
        create: { accountId: account.id, ...ch.audience },
        update: { ...ch.audience },
      });
    }
  }

  return club;
}

async function main() {
  console.log("Seeding Social Audit (upsert)…");
  for (const club of clubs) {
    const c = await upsertClub(club);
    console.log(`  ✓ ${c.name}`);
  }
  console.log(`Done. ${clubs.length} clubs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
