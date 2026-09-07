import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  requireSession,
  assertWorkspaceAccess,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/rbac";
import { generateKeyBetween } from "@/lib/fractional-index";
import { emitEvent } from "@/lib/sse";

function handleError(e: unknown) {
  if (e instanceof UnauthorizedError)
    return NextResponse.json({ error: e.message }, { status: 401 });
  if (e instanceof ForbiddenError)
    return NextResponse.json({ error: e.message }, { status: 403 });
  console.error(e);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}

const schema = z.object({
  columnId: z.string(),
  beforeId: z.string().nullable().optional(),
  afterId: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: { column: { include: { board: true } } },
    });
    if (!task) throw new ForbiddenError("Task not found");
    await assertWorkspaceAccess(session, task.column.board.workspaceId);

    const targetColumn = await prisma.column.findUnique({
      where: { id: parsed.data.columnId },
      include: { board: true },
    });
    if (!targetColumn) throw new ForbiddenError("Column not found");
    await assertWorkspaceAccess(session, targetColumn.board.workspaceId);

    let beforePos: string | null = null;
    let afterPos: string | null = null;
    if (parsed.data.beforeId) {
      const before = await prisma.task.findUnique({
        where: { id: parsed.data.beforeId },
      });
      beforePos = before?.position ?? null;
    }
    if (parsed.data.afterId) {
      const after = await prisma.task.findUnique({
        where: { id: parsed.data.afterId },
      });
      afterPos = after?.position ?? null;
    }

    // If no neighbors given, append to end
    if (!beforePos && !afterPos) {
      const last = await prisma.task.findFirst({
        where: {
          columnId: parsed.data.columnId,
          NOT: { id },
        },
        orderBy: { position: "desc" },
      });
      beforePos = last?.position ?? null;
    }

    const position = generateKeyBetween(beforePos, afterPos);

    const updated = await prisma.task.update({
      where: { id },
      data: {
        columnId: parsed.data.columnId,
        position,
      },
      include: {
        assignee: { select: { id: true, fullName: true, username: true } },
        labels: true,
      },
    });

    emitEvent({
      type: "task.moved",
      workspaceId: targetColumn.board.workspaceId,
      boardId: targetColumn.boardId,
      payload: updated,
    });

    return NextResponse.json({ task: updated });
  } catch (e) {
    return handleError(e);
  }
}
