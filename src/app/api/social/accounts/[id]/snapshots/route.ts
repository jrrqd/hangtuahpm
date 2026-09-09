import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SnapshotSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  assertSocialAuditAccess,
  requireSession,
} from "@/lib/rbac";
import { handleSocialError } from "@/lib/social-api";

const schema = z.object({
  capturedAt: z.string().min(8),
  followers: z.number().int().nonnegative().nullable().optional(),
  following: z.number().int().nonnegative().nullable().optional(),
  contentCount: z.number().int().nonnegative().nullable().optional(),
  avgLikes: z.number().nonnegative().nullable().optional(),
  avgComments: z.number().nonnegative().nullable().optional(),
  avgViews: z.number().nonnegative().nullable().optional(),
  engagementRate: z.number().nonnegative().nullable().optional(),
  sampleSize: z.number().int().positive().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  source: z.enum(["PUBLIC_RESEARCH", "MANUAL"]).optional(),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    await assertSocialAuditAccess(session);
    const { id } = await ctx.params;
    const account = await prisma.socialAccount.findUnique({
      where: { id },
    });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    if (account.missing) {
      return NextResponse.json(
        { error: "Cannot snapshot a missing account" },
        { status: 400 }
      );
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const capturedAt = new Date(parsed.data.capturedAt);
    if (Number.isNaN(capturedAt.getTime())) {
      return NextResponse.json(
        { error: "Invalid capturedAt" },
        { status: 400 }
      );
    }

    let engagementRate = parsed.data.engagementRate ?? null;
    if (
      engagementRate == null &&
      parsed.data.followers &&
      (parsed.data.avgLikes != null || parsed.data.avgComments != null)
    ) {
      engagementRate =
        ((parsed.data.avgLikes ?? 0) + (parsed.data.avgComments ?? 0)) /
        parsed.data.followers;
    }

    const snapshot = await prisma.metricSnapshot.create({
      data: {
        accountId: id,
        capturedAt,
        followers: parsed.data.followers ?? null,
        following: parsed.data.following ?? null,
        contentCount: parsed.data.contentCount ?? null,
        avgLikes: parsed.data.avgLikes ?? null,
        avgComments: parsed.data.avgComments ?? null,
        avgViews: parsed.data.avgViews ?? null,
        engagementRate,
        sampleSize: parsed.data.sampleSize ?? null,
        notes: parsed.data.notes ?? null,
        source: parsed.data.source ?? SnapshotSource.MANUAL,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: "social.snapshot.create",
        targetType: "MetricSnapshot",
        targetId: snapshot.id,
        meta: { accountId: id },
      },
    });

    return NextResponse.json({ snapshot });
  } catch (e) {
    return handleSocialError(e);
  }
}
