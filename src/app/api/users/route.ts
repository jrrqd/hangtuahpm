import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  requireRole,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/rbac";
import { hashPassword } from "@/lib/password";
import { generateTempPassword } from "@/lib/utils";

function handleError(e: unknown) {
  if (e instanceof UnauthorizedError) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
  if (e instanceof ForbiddenError) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
  console.error(e);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}

export async function GET() {
  try {
    await requireRole(Role.ADMIN);
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        memberships: { include: { workspace: true } },
      },
    });
    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        role: u.role,
        active: u.active,
        mustResetPw: u.mustResetPw,
        workspaces: u.memberships.map((m) => ({
          id: m.workspace.id,
          slug: m.workspace.slug,
          name: m.workspace.name,
        })),
        createdAt: u.createdAt,
      })),
    });
  } catch (e) {
    return handleError(e);
  }
}

const createSchema = z.object({
  username: z.string().min(2).max(40),
  fullName: z.string().min(2).max(100),
  role: z.enum(["ADMIN", "LEADERSHIP", "STAFF"]),
  workspaceIds: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(Role.ADMIN);
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const user = await prisma.user.create({
      data: {
        username: parsed.data.username,
        fullName: parsed.data.fullName,
        role: parsed.data.role as Role,
        passwordHash,
        mustResetPw: true,
        memberships:
          parsed.data.role === "STAFF" && parsed.data.workspaceIds?.length
            ? {
                create: parsed.data.workspaceIds.map((workspaceId) => ({
                  workspaceId,
                })),
              }
            : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: "user.create",
        targetType: "User",
        targetId: user.id,
        meta: { username: user.username, role: user.role },
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
      tempPassword,
    });
  } catch (e) {
    return handleError(e);
  }
}

const patchSchema = z.object({
  id: z.string(),
  fullName: z.string().min(2).optional(),
  role: z.enum(["ADMIN", "LEADERSHIP", "STAFF"]).optional(),
  active: z.boolean().optional(),
  workspaceIds: z.array(z.string()).optional(),
  resetPassword: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole(Role.ADMIN);
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    let tempPassword: string | undefined;
    const data: {
      fullName?: string;
      role?: Role;
      active?: boolean;
      passwordHash?: string;
      mustResetPw?: boolean;
    } = {};

    if (parsed.data.fullName) data.fullName = parsed.data.fullName;
    if (parsed.data.role) data.role = parsed.data.role as Role;
    if (typeof parsed.data.active === "boolean") data.active = parsed.data.active;

    if (parsed.data.resetPassword) {
      tempPassword = generateTempPassword();
      data.passwordHash = await hashPassword(tempPassword);
      data.mustResetPw = true;
    }

    const user = await prisma.user.update({
      where: { id: parsed.data.id },
      data,
    });

    if (parsed.data.workspaceIds) {
      await prisma.workspaceMember.deleteMany({
        where: { userId: user.id },
      });
      if (user.role === Role.STAFF && parsed.data.workspaceIds.length) {
        await prisma.workspaceMember.createMany({
          data: parsed.data.workspaceIds.map((workspaceId) => ({
            userId: user.id,
            workspaceId,
          })),
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: "user.update",
        targetType: "User",
        targetId: user.id,
        meta: { ...parsed.data, tempPassword: undefined },
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        active: user.active,
      },
      tempPassword,
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireRole(Role.ADMIN);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    if (id === session.userId) {
      return NextResponse.json(
        { error: "Cannot delete yourself" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: "user.delete",
        targetType: "User",
        targetId: id,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
