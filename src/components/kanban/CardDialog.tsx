"use client";

import { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MemberDTO, TaskDTO } from "./Board";
import { Priority } from "@prisma/client";
import { toast } from "sonner";
import { format } from "date-fns";

type CommentDTO = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; fullName: string };
};

export function CardDialog({
  task,
  members,
  workspaceId,
  open,
  onOpenChange,
  onSaved,
  onDeleted,
}: {
  task: TaskDTO;
  members: MemberDTO[];
  workspaceId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: (t: TaskDTO) => void;
  onDeleted: (id: string) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId || "");
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.slice(0, 10) : ""
  );
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: (() => {
      try {
        return task.description ? JSON.parse(task.description) : "";
      } catch {
        return task.description || "";
      }
    })(),
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] rounded-md border border-input px-3 py-2 text-sm focus:outline-none",
      },
    },
  });

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/hangtuahpm/api/tasks/${task.id}`);
      if (!res.ok) return;
      const data = await res.json();
      const list = (data.task?.comments || []) as CommentDTO[];
      setComments(
        list.map((c) => ({
          ...c,
          createdAt:
            typeof c.createdAt === "string"
              ? c.createdAt
              : new Date(c.createdAt).toISOString(),
        }))
      );
    } finally {
      setLoadingComments(false);
    }
  }, [task.id]);

  useEffect(() => {
    setTitle(task.title);
    setPriority(task.priority);
    setAssigneeId(task.assigneeId || "");
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
  }, [task]);

  useEffect(() => {
    if (!open) return;
    void loadComments();
  }, [open, task.id, loadComments]);

  useEffect(() => {
    if (!open) return;
    const es = new EventSource(
      `/hangtuahpm/api/events/stream?workspaceId=${workspaceId}`
    );
    es.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data);
        if (
          event.type === "comment.created" &&
          event.payload?.taskId === task.id
        ) {
          void loadComments();
        }
      } catch {
        /* ignore */
      }
    };
    return () => es.close();
  }, [open, workspaceId, task.id, loadComments]);

  function applyTaskFromResponse(data: {
    task: TaskDTO & { comments?: CommentDTO[]; dueDate?: string | Date | null };
  }) {
    const nextComments = (data.task.comments || []) as CommentDTO[];
    setComments(
      nextComments.map((c) => ({
        ...c,
        createdAt:
          typeof c.createdAt === "string"
            ? c.createdAt
            : new Date(c.createdAt).toISOString(),
      }))
    );
    const due =
      data.task.dueDate == null
        ? null
        : typeof data.task.dueDate === "string"
          ? data.task.dueDate
          : new Date(data.task.dueDate).toISOString();
    onSaved({
      ...task,
      title: data.task.title ?? task.title,
      description: data.task.description ?? task.description,
      priority: data.task.priority ?? task.priority,
      assigneeId:
        data.task.assigneeId !== undefined
          ? data.task.assigneeId
          : task.assigneeId,
      assignee:
        data.task.assignee !== undefined ? data.task.assignee : task.assignee,
      dueDate: due,
      commentCount: nextComments.length,
    });
  }

  async function save() {
    setSaving(true);
    try {
      const description = editor
        ? JSON.stringify(editor.getJSON())
        : task.description;
      const res = await fetch(`/hangtuahpm/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priority,
          assigneeId: assigneeId || null,
          dueDate: dueDate || null,
          comment: comment || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      applyTaskFromResponse(data);
      setComment("");
      toast.success("Task saved");
    } catch {
      toast.error("Could not save task");
    } finally {
      setSaving(false);
    }
  }

  async function postUpdate() {
    const body = comment.trim();
    if (!body) {
      toast.error("Write a progress update first");
      return;
    }
    setPosting(true);
    try {
      const res = await fetch(`/hangtuahpm/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: body }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      applyTaskFromResponse(data);
      setComment("");
      toast.success("Progress update posted");
    } catch {
      toast.error("Could not post update");
    } finally {
      setPosting(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this task?")) return;
    const res = await fetch(`/hangtuahpm/api/tasks/${task.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Could not delete");
      return;
    }
    onDeleted(task.id);
  }

  async function upload(file: File) {
    const form = new FormData();
    form.append("file", file);
    form.append("taskId", task.id);
    const res = await fetch("/hangtuahpm/api/upload", {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      toast.error("Upload failed");
      return;
    }
    toast.success("Attachment uploaded");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Task Detail</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <EditorContent editor={editor} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                {(["LOW", "MEDIUM", "HIGH", "URGENT"] as Priority[]).map(
                  (p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Assignee</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 border-t pt-4">
            <Label>Progress updates</Label>
            <div className="max-h-48 space-y-3 overflow-y-auto rounded-md border bg-muted/30 p-3">
              {loadingComments && comments.length === 0 ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No updates yet. Post one so the team knows what&apos;s going
                  on.
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="text-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-navy">
                        {c.author.fullName}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {format(new Date(c.createdAt), "MMM d, HH:mm")}
                      </span>
                    </div>
                    <p className="mt-0.5 text-muted-foreground whitespace-pre-wrap">
                      {c.body}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What's the latest on this task?"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    postUpdate();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={postUpdate}
                disabled={posting || !comment.trim()}
              >
                {posting ? "Posting…" : "Post update"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Attachment</Label>
            <Input
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
              }}
            />
          </div>
          <div className="flex justify-between gap-2 pt-2">
            <Button variant="destructive" onClick={remove}>
              Delete
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
