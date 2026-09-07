import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canAdmin } from "@/lib/rbac";
import { WorkspaceForm } from "@/components/admin/WorkspaceForm";

export default async function AdminWorkspacesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canAdmin(session.role)) redirect("/dashboard");
  return (
    <div className="p-8">
      <WorkspaceForm />
    </div>
  );
}
