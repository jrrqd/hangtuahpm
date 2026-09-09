import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  assertSocialAuditAccess,
  requireSession,
} from "@/lib/rbac";
import { handleSocialError } from "@/lib/social-api";
import {
  globalDataLastRefreshedAt,
  loadClubsWithLatest,
} from "@/lib/social-data";
import { profileUrlFor } from "@/lib/social";
import type { SocialChannel } from "@prisma/client";

export async function GET() {
  try {
    const session = await requireSession();
    await assertSocialAuditAccess(session);
    const clubs = await loadClubsWithLatest();
    const dataLastRefreshedAt = await globalDataLastRefreshedAt();
    return NextResponse.json({ clubs, dataLastRefreshedAt });
  } catch (e) {
    return handleSocialError(e);
  }
}

const accountInput = z.object({
  channel: z.enum(["INSTAGRAM", "TIKTOK", "X", "YOUTUBE"]),
  handle: z.string().min(1).max(80).optional().nullable(),
  missing: z.boolean().optional(),
  displayName: z.string().max(120).optional().nullable(),
});

const createSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  city: z.string().min(2).max(80),
  isHangtuah: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
  accounts: z.array(accountInput).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    await assertSocialAuditAccess(session);
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const data = parsed.data;
    if (data.isHangtuah) {
      await prisma.club.updateMany({
        where: { isHangtuah: true },
        data: { isHangtuah: false },
      });
    }

    const club = await prisma.club.create({
      data: {
        name: data.name,
        slug: data.slug,
        city: data.city,
        isHangtuah: Boolean(data.isHangtuah),
        notes: data.notes ?? null,
        accounts: data.accounts
          ? {
              create: data.accounts.map((a) => {
                const missing = a.missing ?? !a.handle;
                const handle = missing
                  ? null
                  : a.handle!.replace(/^@/, "");
                return {
                  channel: a.channel as SocialChannel,
                  handle,
                  missing,
                  displayName: a.displayName ?? null,
                  profileUrl: profileUrlFor(a.channel as SocialChannel, handle),
                };
              }),
            }
          : undefined,
      },
      include: { accounts: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: "social.club.create",
        targetType: "Club",
        targetId: club.id,
        meta: { slug: club.slug },
      },
    });

    return NextResponse.json({ club });
  } catch (e) {
    return handleSocialError(e);
  }
}

const patchSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(120).optional(),
  city: z.string().min(2).max(80).optional(),
  notes: z.string().max(2000).optional().nullable(),
  active: z.boolean().optional(),
  isHangtuah: z.boolean().optional(),
  accounts: z
    .array(
      accountInput.extend({
        id: z.string().optional(),
      })
    )
    .optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    await assertSocialAuditAccess(session);
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const data = parsed.data;

    if (data.isHangtuah) {
      await prisma.club.updateMany({
        where: { isHangtuah: true, NOT: { id: data.id } },
        data: { isHangtuah: false },
      });
    }

    const club = await prisma.club.update({
      where: { id: data.id },
      data: {
        name: data.name,
        city: data.city,
        notes: data.notes,
        active: data.active,
        isHangtuah: data.isHangtuah,
      },
    });

    if (data.accounts) {
      for (const a of data.accounts) {
        const channel = a.channel as SocialChannel;
        const missing = a.missing ?? !a.handle;
        const handle = missing ? null : a.handle!.replace(/^@/, "");
        await prisma.socialAccount.upsert({
          where: {
            clubId_channel: { clubId: club.id, channel },
          },
          create: {
            clubId: club.id,
            channel,
            handle,
            missing,
            displayName: a.displayName ?? null,
            profileUrl: profileUrlFor(channel, handle),
          },
          update: {
            handle,
            missing,
            displayName: a.displayName ?? null,
            profileUrl: profileUrlFor(channel, handle),
          },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: "social.club.update",
        targetType: "Club",
        targetId: club.id,
      },
    });

    const [updated] = await loadClubsWithLatest({ slug: club.slug });
    return NextResponse.json({ club: updated });
  } catch (e) {
    return handleSocialError(e);
  }
}
