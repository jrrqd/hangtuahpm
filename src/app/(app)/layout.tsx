import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canAccessSocialAudit, getAccessibleWorkspaces } from "@/lib/rbac";
import { AppShell } from "@/components/shell/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustResetPw) redirect("/reset-password");

  const workspaces = await getAccessibleWorkspaces(session);
  const canAccessSocial = await canAccessSocialAudit(session);

  return (
    <AppShell
      role={session.role}
      fullName={session.fullName}
      workspaces={workspaces.map((w) => ({ slug: w.slug, name: w.name }))}
      canAccessSocial={canAccessSocial}
    >
      {children}
    </AppShell>
  );
}
