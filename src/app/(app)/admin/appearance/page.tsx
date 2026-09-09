import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canAdmin } from "@/lib/rbac";
import { getAppTheme } from "@/lib/settings";
import { AppearanceSettings } from "@/components/admin/AppearanceSettings";

export default async function AdminAppearancePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canAdmin(session.role)) redirect("/dashboard");

  const theme = await getAppTheme();

  return (
    <div className="p-4 md:p-8">
      <AppearanceSettings initialTheme={theme} />
    </div>
  );
}
