"use client";

import { useEffect, useState } from "react";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleChip } from "@/components/shell/RoleChip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Workspace = { id: string; slug: string; name: string };
type UserRow = {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  active: boolean;
  mustResetPw: boolean;
  workspaces: Workspace[];
};

type FormState = {
  username: string;
  fullName: string;
  role: Role;
  workspaceIds: string[];
  active: boolean;
};

const emptyForm: FormState = {
  username: "",
  fullName: "",
  role: "STAFF",
  workspaceIds: [],
  active: true,
};

export function UserTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  async function load() {
    const [u, w] = await Promise.all([
      fetch("/hangtuahpm/api/users").then((r) => r.json()),
      fetch("/hangtuahpm/api/workspaces").then((r) => r.json()),
    ]);
    setUsers(u.users || []);
    setWorkspaces(w.workspaces || []);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(u: UserRow) {
    setMode("edit");
    setEditingId(u.id);
    setForm({
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      workspaceIds: u.workspaces.map((w) => w.id),
      active: u.active,
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (mode === "create") {
        const res = await fetch("/hangtuahpm/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.username,
            fullName: form.fullName,
            role: form.role,
            workspaceIds: form.workspaceIds,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed");
          return;
        }
        setTempPw(data.tempPassword);
        toast.success("User created");
      } else if (editingId) {
        const res = await fetch("/hangtuahpm/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            fullName: form.fullName,
            role: form.role,
            workspaceIds: form.workspaceIds,
            active: form.active,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed");
          return;
        }
        toast.success("User updated");
      }
      setOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(id: string) {
    const res = await fetch("/hangtuahpm/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resetPassword: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed");
      return;
    }
    setTempPw(data.tempPassword);
    toast.success("Password reset");
    load();
  }

  async function toggleActive(u: UserRow) {
    const res = await fetch("/hangtuahpm/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, active: !u.active }),
    });
    if (!res.ok) {
      toast.error("Could not update status");
      return;
    }
    toast.success(u.active ? "User deactivated" : "User activated");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/hangtuahpm/api/users?id=${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Could not delete");
      return;
    }
    toast.success("User deleted");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl tracking-[0.12em] text-navy">
          Users
        </h1>
        <Button onClick={openCreate}>Create user</Button>
      </div>

      {tempPw && (
        <div className="rounded-md border border-sky/40 bg-sky/5 p-4 text-sm">
          <p className="font-medium text-navy mb-1">Temporary password</p>
          <code className="font-stat text-fight text-base">{tempPw}</code>
          <p className="text-muted-foreground mt-1 text-xs">
            Shown once. User must change it on first login.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => setTempPw(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted font-display text-xs tracking-wider text-left">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Workspaces</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.fullName}</div>
                  <div className="text-xs text-muted-foreground">
                    @{u.username}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <RoleChip role={u.role} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {u.role === "STAFF"
                    ? u.workspaces.map((w) => w.name).join(", ") || "—"
                    : "All"}
                </td>
                <td className="px-4 py-3">
                  {u.active ? "Active" : "Inactive"}
                  {u.mustResetPw && (
                    <span className="ml-2 text-xs text-amber-600">
                      reset pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(u)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resetPassword(u.id)}
                  >
                    Reset pw
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleActive(u)}
                  >
                    {u.active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => remove(u.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Create User" : "Edit User"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                required
                disabled={mode === "edit"}
                readOnly={mode === "edit"}
              />
            </div>
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input
                value={form.fullName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fullName: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value as Role }))
                }
              >
                <option value="STAFF">STAFF</option>
                <option value="LEADERSHIP">LEADERSHIP</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            {form.role === "STAFF" && (
              <div className="space-y-2">
                <Label>Workspaces</Label>
                <div className="space-y-1">
                  {workspaces.map((w) => (
                    <label
                      key={w.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={form.workspaceIds.includes(w.id)}
                        onChange={(e) => {
                          setForm((f) => ({
                            ...f,
                            workspaceIds: e.target.checked
                              ? [...f.workspaceIds, w.id]
                              : f.workspaceIds.filter((id) => id !== w.id),
                          }));
                        }}
                      />
                      {w.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {mode === "edit" && (
              <div className="space-y-2">
                <Label>Status</Label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, active: e.target.checked }))
                    }
                  />
                  Active
                </label>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving
                ? "Saving…"
                : mode === "create"
                  ? "Create"
                  : "Save changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
