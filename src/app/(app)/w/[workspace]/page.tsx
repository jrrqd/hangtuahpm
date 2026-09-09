import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { assertWorkspaceAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateBoardButton } from "./create-board-button";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { workspace: slug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: {
      boards: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!workspace) notFound();

  try {
    await assertWorkspaceAccess(session, workspace.id);
  } catch {
    redirect("/w");
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl tracking-[0.12em] text-navy">
            {workspace.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {workspace.description}
          </p>
        </div>
        <CreateBoardButton workspaceId={workspace.id} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workspace.boards.map((b) => (
          <Link key={b.id} href={`/w/${slug}/b/${b.id}`}>
            <Card className="hover:border-sky transition-colors">
              <CardHeader>
                <CardTitle>{b.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm">
                  Open board
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
        {workspace.boards.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No boards yet — create one to set up your court.
          </p>
        )}
      </div>
    </div>
  );
}
