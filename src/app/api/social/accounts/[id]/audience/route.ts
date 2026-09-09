import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  assertSocialAuditAccess,
  requireSession,
} from "@/lib/rbac";
import { handleSocialError } from "@/lib/social-api";

const schema = z.object({
  primaryLanguage: z.string().max(80).nullable().optional(),
  inferredGeo: z.string().max(200).nullable().optional(),
  contentPillars: z.string().max(2000).nullable().optional(),
  fanTone: z.string().max(500).nullable().optional(),
  strengths: z.string().max(2000).nullable().optional(),
  gaps: z.string().max(2000).nullable().optional(),
});

export async function PUT(
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

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const audience = await prisma.audienceProfile.upsert({
      where: { accountId: id },
      create: { accountId: id, ...parsed.data },
      update: { ...parsed.data },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: "social.audience.update",
        targetType: "AudienceProfile",
        targetId: audience.id,
        meta: { accountId: id },
      },
    });

    return NextResponse.json({ audience });
  } catch (e) {
    return handleSocialError(e);
  }
}
