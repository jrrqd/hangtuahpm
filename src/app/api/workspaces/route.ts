import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  requireRole,
  requireSession,
  getAccessibleWorkspaces,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/rbac";

function handleError(e: unknown) {
  if (e instanceof UnauthorizedError)
    return NextResponse.json({ error: e.message }, { status: 401 });
  if (e instanceof ForbiddenError)
    return NextResponse.json({ error: e.message }, { status: 403 });
  console.error(e);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}

export async function GET() {
  try {
    const session = await requireSession();
    const workspaces = await getAccessibleWorkspaces(session);
    return NextResponse.json({ workspaces });
  } catch (e) {
    return handleError(e);
  }
}

const createSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(80),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(Role.ADMIN);
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const workspace = await prisma.workspace.create({ data: parsed.data });
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: "workspace.create",
        targetType: "Workspace",
        targetId: workspace.id,
        meta: parsed.data,
      },
    });
    return NextResponse.json({ workspace });
  } catch (e) {
    return handleError(e);
  }
}

const patchSchema = z.object({
  id: z.string(),
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole(Role.ADMIN);
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const workspace = await prisma.workspace.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: "workspace.update",
        targetType: "Workspace",
        targetId: workspace.id,
      },
    });
    return NextResponse.json({ workspace });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireRole(Role.ADMIN);
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.workspace.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: "workspace.delete",
        targetType: "Workspace",
        targetId: id,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
