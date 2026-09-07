"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Workspace = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

type FormState = {
  slug: string;
  name: string;
  description: string;
};

const emptyForm: FormState = {
  slug: "",
  name: "",
  description: "",
};

export function WorkspaceForm() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  async function load() {
    const res = await fetch("/hangtuahpm/api/workspaces");
    const data = await res.json();
    setWorkspaces(data.workspaces || []);
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

  function openEdit(w: Workspace) {
    setMode("edit");
    setEditingId(w.id);
    setForm({
      slug: w.slug,
      name: w.name,
      description: w.description || "",
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (mode === "create") {
        const res = await fetch("/hangtuahpm/api/workspaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed");
          return;
        }
        toast.success("Workspace created");
      } else if (editingId) {
        const res = await fetch("/hangtuahpm/api/workspaces", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            name: form.name,
            description: form.description,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed");
          return;
        }
        toast.success("Workspace updated");
      }
      setOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (
      !confirm(
        "Delete this workspace and all boards/tasks? This cannot be undone."
      )
    )
      return;
    const res = await fetch(`/hangtuahpm/api/workspaces?id=${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Could not delete");
      return;
    }
    toast.success("Workspace deleted");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl tracking-[0.12em] text-navy">
          Workspaces
        </h1>
        <Button onClick={openCreate}>Create workspace</Button>
      </div>
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted font-display text-xs tracking-wider text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workspaces.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="px-4 py-3 font-medium">{w.name}</td>
                <td className="px-4 py-3 font-stat text-muted-foreground">
                  {w.slug}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {w.description || "—"}
                </td>
                <td className="px-4 py-3 space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(w)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => remove(w.id)}
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
              {mode === "create" ? "Create Workspace" : "Edit Workspace"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, ""),
                  }))
                }
                placeholder="marketing"
                required
                disabled={mode === "edit"}
                readOnly={mode === "edit"}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
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
