import { NextRequest, NextResponse } from "next/server";
import {
  assertSocialAuditAccess,
  requireSession,
} from "@/lib/rbac";
import { handleSocialError } from "@/lib/social-api";
import { loadClubsWithLatest } from "@/lib/social-data";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await requireSession();
    await assertSocialAuditAccess(session);
    const { slug } = await ctx.params;
    const clubs = await loadClubsWithLatest({
      slug,
      includeHistory: true,
    });
    if (!clubs.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ club: clubs[0] });
  } catch (e) {
    return handleSocialError(e);
  }
}
