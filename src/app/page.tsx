import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustResetPw) redirect("/reset-password");
  if (session.role === "ADMIN") redirect("/admin/users");
  if (session.role === "LEADERSHIP") redirect("/dashboard");
  redirect("/w");
}
