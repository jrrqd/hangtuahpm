import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAccessibleWorkspaces } from "@/lib/rbac";
import { Sidebar } from "@/components/shell/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustResetPw) redirect("/reset-password");

  const workspaces = await getAccessibleWorkspaces(session);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        role={session.role}
        fullName={session.fullName}
        workspaces={workspaces.map((w) => ({ slug: w.slug, name: w.name }))}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
