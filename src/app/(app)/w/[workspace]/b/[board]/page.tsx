import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { assertWorkspaceAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { KanbanBoard } from "@/components/kanban/Board";
import { sortByPosition } from "@/lib/fractional-index";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ workspace: string; board: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { workspace: slug, board: boardId } = await params;

  const workspace = await prisma.workspace.findUnique({ where: { slug } });
  if (!workspace) notFound();

  try {
    await assertWorkspaceAccess(session, workspace.id);
  } catch {
    redirect("/w");
  }

  const board = await prisma.board.findFirst({
    where: { id: boardId, workspaceId: workspace.id },
    include: {
      columns: {
        orderBy: { position: "asc" },
        include: {
          tasks: {
            include: {
              assignee: {
                select: { id: true, fullName: true, username: true },
              },
              _count: { select: { comments: true } },
            },
          },
        },
      },
    },
  });
  if (!board) notFound();

  const members =
    session.role === Role.ADMIN || session.role === Role.LEADERSHIP
      ? await prisma.user.findMany({
          where: { active: true },
          select: { id: true, fullName: true, username: true },
          orderBy: { fullName: "asc" },
        })
      : (
          await prisma.workspaceMember.findMany({
            where: { workspaceId: workspace.id },
            include: {
              user: {
                select: { id: true, fullName: true, username: true },
              },
            },
          })
        ).map((m) => m.user);

  const columns = board.columns.map((c) => ({
    id: c.id,
    name: c.name,
    position: c.position,
    tasks: sortByPosition(c.tasks).map((t) => ({
      id: t.id,
      columnId: t.columnId,
      title: t.title,
      description: t.description,
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      position: t.position,
      assigneeId: t.assigneeId,
      assignee: t.assignee,
      commentCount: t._count.comments,
    })),
  }));

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <Link
          href={`/w/${slug}`}
          className="text-xs font-display tracking-wider text-sky hover:underline"
        >
          ← {workspace.name}
        </Link>
        <h1 className="font-display text-2xl tracking-[0.12em] text-navy mt-1">
          {board.name}
        </h1>
      </div>
      <KanbanBoard
        boardId={board.id}
        workspaceId={workspace.id}
        initialColumns={columns}
        members={members}
      />
    </div>
  );
}
