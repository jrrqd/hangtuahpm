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

type Workspace = { id: string; name: string; slug: string };
type Board = {
  id: string;
  name: string;
  workspace: Workspace;
};

export function BoardAdmin() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ workspaceId: "", name: "Sprint Board" });

  async function load() {
    const [b, w] = await Promise.all([
      fetch("/hangtuahpm/api/boards").then((r) => r.json()),
      fetch("/hangtuahpm/api/workspaces").then((r) => r.json()),
    ]);
    setBoards(b.boards || []);
    setWorkspaces(w.workspaces || []);
    if (!form.workspaceId && w.workspaces?.[0]) {
      setForm((f) => ({ ...f, workspaceId: w.workspaces[0].id }));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/hangtuahpm/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      toast.error("Failed");
      return;
    }
    toast.success("Board created");
    setOpen(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete board and all tasks?")) return;
    await fetch(`/hangtuahpm/api/boards?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl tracking-[0.12em] text-navy">
          Boards
        </h1>
        <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
          Create board
        </Button>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted font-display text-xs tracking-wider text-left">
            <tr>
              <th className="px-4 py-3">Board</th>
              <th className="px-4 py-3">Workspace</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {boards.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="px-4 py-3 font-medium">{b.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {b.workspace?.name}
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => remove(b.id)}
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
            <DialogTitle>Create Board</DialogTitle>
          </DialogHeader>
          <form onSubmit={create} className="space-y-3">
            <div className="space-y-2">
              <Label>Workspace</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.workspaceId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, workspaceId: e.target.value }))
                }
                required
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
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
            <Button type="submit" className="w-full">
              Create
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
