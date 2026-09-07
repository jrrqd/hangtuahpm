import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  requireSession,
  requireRole,
  assertWorkspaceAccess,
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

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const workspaceId = new URL(req.url).searchParams.get("workspaceId");
    if (workspaceId) {
      await assertWorkspaceAccess(session, workspaceId);
      const boards = await prisma.board.findMany({
        where: { workspaceId },
        include: { columns: { orderBy: { position: "asc" } }, workspace: true },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ boards });
    }
    if (session.role !== Role.ADMIN && session.role !== Role.LEADERSHIP) {
      throw new ForbiddenError();
    }
    const boards = await prisma.board.findMany({
      include: { workspace: true, columns: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ boards });
  } catch (e) {
    return handleError(e);
  }
}

const createSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1).max(80),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    await assertWorkspaceAccess(session, parsed.data.workspaceId);

    const board = await prisma.board.create({
      data: {
        workspaceId: parsed.data.workspaceId,
        name: parsed.data.name,
        columns: {
          create: [
            { name: "To Do", position: 0 },
            { name: "In Progress", position: 1 },
            { name: "Review", position: 2 },
            { name: "Done", position: 3 },
          ],
        },
      },
      include: { columns: true },
    });

    if (session.role === Role.ADMIN) {
      await prisma.auditLog.create({
        data: {
          actorId: session.userId,
          action: "board.create",
          targetType: "Board",
          targetId: board.id,
        },
      });
    }

    return NextResponse.json({ board });
  } catch (e) {
    return handleError(e);
  }
}

const patchSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const existing = await prisma.board.findUnique({
      where: { id: parsed.data.id },
    });
    if (!existing) throw new ForbiddenError("Board not found");
    await assertWorkspaceAccess(session, existing.workspaceId);
    const board = await prisma.board.update({
      where: { id: parsed.data.id },
      data: { name: parsed.data.name },
    });
    return NextResponse.json({ board });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireRole(Role.ADMIN, Role.LEADERSHIP);
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const existing = await prisma.board.findUnique({ where: { id } });
    if (!existing) throw new ForbiddenError("Board not found");
    await assertWorkspaceAccess(session, existing.workspaceId);
    await prisma.board.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
