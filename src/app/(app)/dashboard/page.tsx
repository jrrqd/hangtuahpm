import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { DashboardHero } from "@/components/brand/DashboardHero";
import { canSeeDashboard } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PriorityBadge } from "@/components/shell/RoleChip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canSeeDashboard(session.role)) redirect("/w");

  const workspaces = await prisma.workspace.findMany({
    orderBy: { name: "asc" },
    include: {
      boards: {
        include: {
          columns: {
            include: { tasks: true },
          },
        },
      },
    },
  });

  const now = new Date();
  const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const stats = workspaces.map((w) => {
    const tasks = w.boards.flatMap((b) =>
      b.columns.flatMap((c) =>
        c.tasks.map((t) => ({ ...t, columnName: c.name }))
      )
    );
    const open = tasks.filter((t) => t.columnName !== "Done").length;
    const overdue = tasks.filter(
      (t) => t.dueDate && t.dueDate < now && t.columnName !== "Done"
    ).length;
    const dueWeek = tasks.filter(
      (t) =>
        t.dueDate &&
        t.dueDate >= now &&
        t.dueDate <= week &&
        t.columnName !== "Done"
    ).length;
    const inProgress = tasks.filter(
      (t) => t.columnName === "In Progress"
    ).length;
    return { workspace: w, open, overdue, dueWeek, inProgress };
  });

  const inProgressTasks = await prisma.task.findMany({
    where: { column: { name: "In Progress" } },
    include: {
      assignee: { select: { fullName: true } },
      column: {
        include: {
          board: { include: { workspace: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <DashboardHero />

      <div className="p-4 md:p-8 space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <Link key={s.workspace.id} href={`/w/${s.workspace.slug}`}>
              <Card className="hover:border-sky transition-colors h-full">
                <CardHeader>
                  <CardTitle>{s.workspace.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Stat label="Open" value={s.open} />
                    <Stat label="In Progress" value={s.inProgress} />
                    <Stat label="Overdue" value={s.overdue} accent={s.overdue > 0} />
                    <Stat label="Due 7d" value={s.dueWeek} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div>
          <h2 className="font-display text-lg tracking-wider text-navy mb-4">
            In Progress — All Courts
          </h2>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted font-display text-xs tracking-wider text-left">
                <tr>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Division</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Priority</th>
                </tr>
              </thead>
              <tbody>
                {inProgressTasks.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/w/${t.column.board.workspace.slug}/b/${t.column.board.id}`}
                        className="font-medium text-navy hover:text-sky"
                      >
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.column.board.workspace.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.assignee?.fullName || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={t.priority} />
                    </td>
                  </tr>
                ))}
                {inProgressTasks.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No tasks in progress. The court is quiet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`font-stat text-2xl font-semibold ${accent ? "text-fight" : "text-navy"}`}
      >
        {value}
      </div>
    </div>
  );
}
