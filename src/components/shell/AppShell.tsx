"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/shell/Sidebar";
import { cn } from "@/lib/utils";

type WorkspaceNav = { slug: string; name: string };

export function AppShell({
  role,
  fullName,
  workspaces,
  children,
}: {
  role: Role;
  fullName: string;
  workspaces: WorkspaceNav[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <header
        className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-white/10 bg-navy px-4 text-white lg:hidden"
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md p-2 hover:bg-white/10"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-display text-xs tracking-[0.2em]">
          Hangtuah PM
        </span>
      </header>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-navy/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        />
      )}

      <Sidebar
        role={role}
        fullName={fullName}
        workspaces={workspaces}
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        onNavigate={() => setOpen(false)}
      />

      <main className="min-w-0 flex-1 overflow-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
