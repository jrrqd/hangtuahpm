import { NextRequest, NextResponse } from "next/server";
import { Priority } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  requireSession,
  assertWorkspaceAccess,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/rbac";
import { emitEvent } from "@/lib/sse";

function handleError(e: unknown) {
  if (e instanceof UnauthorizedError)
    return NextResponse.json({ error: e.message }, { status: 401 });
  if (e instanceof ForbiddenError)
    return NextResponse.json({ error: e.message }, { status: 403 });
  console.error(e);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}

async function loadTask(id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      column: { include: { board: true } },
      assignee: { select: { id: true, fullName: true, username: true } },
      labels: true,
      comments: {
        include: { author: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: "asc" },
      },
      attachments: true,
    },
  });
  if (!task) throw new ForbiddenError("Task not found");
  return task;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const task = await loadTask(id);
    await assertWorkspaceAccess(session, task.column.board.workspaceId);
    return NextResponse.json({ task });
  } catch (e) {
    return handleError(e);
  }
}

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  comment: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const existing = await loadTask(id);
    await assertWorkspaceAccess(session, existing.column.board.workspaceId);

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (parsed.data.comment) {
      await prisma.comment.create({
        data: {
          taskId: id,
          authorId: session.userId,
          body: parsed.data.comment,
        },
      });
      emitEvent({
        type: "comment.created",
        workspaceId: existing.column.board.workspaceId,
        boardId: existing.column.boardId,
        payload: { taskId: id },
      });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority as Priority | undefined,
        assigneeId: parsed.data.assigneeId,
        dueDate:
          parsed.data.dueDate === undefined
            ? undefined
            : parsed.data.dueDate
              ? new Date(parsed.data.dueDate)
              : null,
      },
      include: {
        assignee: { select: { id: true, fullName: true, username: true } },
        labels: true,
        comments: {
          include: { author: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: "asc" },
        },
        attachments: true,
      },
    });

    emitEvent({
      type: "task.updated",
      workspaceId: existing.column.board.workspaceId,
      boardId: existing.column.boardId,
      payload: task,
    });

    return NextResponse.json({ task });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const existing = await loadTask(id);
    await assertWorkspaceAccess(session, existing.column.board.workspaceId);
    await prisma.task.delete({ where: { id } });
    emitEvent({
      type: "task.deleted",
      workspaceId: existing.column.board.workspaceId,
      boardId: existing.column.boardId,
      payload: { id },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
