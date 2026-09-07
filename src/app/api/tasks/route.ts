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

async function getColumnContext(columnId: string) {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: { board: true },
  });
  if (!column) throw new ForbiddenError("Column not found");
  return column;
}

const createSchema = z.object({
  columnId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const column = await getColumnContext(parsed.data.columnId);
    await assertWorkspaceAccess(session, column.board.workspaceId);

    const last = await prisma.task.findFirst({
      where: { columnId: column.id },
      orderBy: { position: "desc" },
    });
    const position = generateKeyBetween(last?.position ?? null, null);

    const task = await prisma.task.create({
      data: {
        columnId: column.id,
        creatorId: session.userId,
        title: parsed.data.title,
        description: parsed.data.description,
        priority: (parsed.data.priority as Priority) || Priority.MEDIUM,
        assigneeId: parsed.data.assigneeId || null,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        position,
      },
      include: {
        assignee: { select: { id: true, fullName: true, username: true } },
        labels: true,
        _count: { select: { comments: true } },
      },
    });

    const taskDto = {
      ...task,
      commentCount: task._count.comments,
    };

    emitEvent({
      type: "task.created",
      workspaceId: column.board.workspaceId,
      boardId: column.boardId,
      payload: taskDto,
    });

    return NextResponse.json({ task: taskDto });
  } catch (e) {
    return handleError(e);
  }
}
