import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canAdmin } from "@/lib/rbac";
import { UserTable } from "@/components/admin/UserTable";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canAdmin(session.role)) redirect("/dashboard");
  return (
    <div className="p-8">
      <UserTable />
    </div>
  );
}
