"use client";

import Link from "next/link";
import { Role } from "@prisma/client";
import { Wordmark } from "@/components/brand/Wordmark";
import { RoleChip } from "@/components/shell/RoleChip";
import { KerisIcon, BasketballIcon } from "@/components/icons/Icons";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, FolderKanban, LogOut } from "lucide-react";

type WorkspaceNav = { slug: string; name: string };

export function Sidebar({
  role,
  fullName,
  workspaces,
  activeSlug,
}: {
  role: Role;
  fullName: string;
  workspaces: WorkspaceNav[];
  activeSlug?: string;
}) {
  const showDash = role === Role.ADMIN || role === Role.LEADERSHIP;
  const showAdmin = role === Role.ADMIN;

  async function logout() {
    await fetch("/hangtuahpm/api/auth/logout", { method: "POST" });
    window.location.href = "/hangtuahpm/login";
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-navy text-white min-h-screen">
      <div className="p-5 border-b border-white/10">
        <Wordmark light priority />
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {showDash && (
          <NavLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>
            Fight Night
          </NavLink>
        )}
        <div className="pt-3 pb-1 px-3 font-display text-[10px] tracking-[0.2em] text-sky">
          Workspaces
        </div>
        {workspaces.map((w) => (
          <NavLink
            key={w.slug}
            href={`/w/${w.slug}`}
            icon={<BasketballIcon className="h-4 w-4" />}
            active={activeSlug === w.slug}
          >
            {w.name}
          </NavLink>
        ))}
        {showAdmin && (
          <>
            <div className="pt-4 pb-1 px-3 font-display text-[10px] tracking-[0.2em] text-sky">
              War Room
            </div>
            <NavLink href="/admin/users" icon={<Users className="h-4 w-4" />}>
              Users
            </NavLink>
            <NavLink
              href="/admin/workspaces"
              icon={<KerisIcon className="h-4 w-4" />}
            >
              Workspaces
            </NavLink>
            <NavLink
              href="/admin/boards"
              icon={<FolderKanban className="h-4 w-4" />}
            >
              Boards
            </NavLink>
          </>
        )}
      </nav>
      <div className="p-4 border-t border-white/10 space-y-3">
        <div>
          <div className="text-sm font-medium truncate">{fullName}</div>
          <div className="mt-1">
            <RoleChip role={role} />
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span className="font-display text-xs tracking-wider">Exit Court</span>
        </button>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  children,
  icon,
  active,
}: {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-white/10 border-l-[3px] border-sky text-white"
          : "text-white/80 hover:bg-white/5 hover:text-white border-l-[3px] border-transparent"
      )}
    >
      {icon}
      <span className="font-display tracking-wider text-xs">{children}</span>
    </Link>
  );
}
