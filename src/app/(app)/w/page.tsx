import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getAccessibleWorkspaces } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BasketballIcon } from "@/components/icons/Icons";

export default async function WorkspacesIndexPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const workspaces = await getAccessibleWorkspaces(session);

  if (workspaces.length === 1) {
    redirect(`/w/${workspaces[0].slug}`);
  }

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl tracking-[0.12em] text-navy mb-2">
        Your Workspaces
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Pick a division court to manage tasks.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((w) => (
          <Link key={w.id} href={`/w/${w.slug}`}>
            <Card className="hover:border-sky transition-colors h-full">
              <CardHeader>
                <div className="flex items-center gap-2 text-sky mb-1">
                  <BasketballIcon className="h-5 w-5" />
                </div>
                <CardTitle>{w.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {w.description || "Division workspace"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
