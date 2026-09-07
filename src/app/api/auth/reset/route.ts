import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import {
  getSession,
  signSession,
  setSessionCookie,
} from "@/lib/auth";
import { requireSession } from "@/lib/rbac";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    if (parsed.data.password !== parsed.data.confirm) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash, mustResetPw: false },
    });

    const token = await signSession({
      userId: user.id,
      role: user.role,
      username: user.username,
      fullName: user.fullName,
      mustResetPw: false,
    });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, role: user.role });
  } catch (e) {
    const status = (e as { status?: number }).status || 500;
    return NextResponse.json(
      { error: status === 401 ? "Unauthorized" : "Reset failed" },
      { status }
    );
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    mustResetPw: session.mustResetPw,
  });
}
