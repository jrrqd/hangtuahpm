import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canAdmin } from "@/lib/rbac";
import { BoardAdmin } from "@/components/admin/BoardAdmin";

export default async function AdminBoardsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canAdmin(session.role)) redirect("/dashboard");
  return (
    <div className="p-4 md:p-8">
      <BoardAdmin />
    </div>
  );
}
