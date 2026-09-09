"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Priority } from "@prisma/client";
import { KanbanColumn } from "./Column";
import { TaskCard } from "./Card";
import { CardDialog } from "./CardDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useTheme } from "@/components/brand/ThemeProvider";

export type TaskDTO = {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: string | null;
  position: string;
  assigneeId: string | null;
  assignee: { id: string; fullName: string; username: string } | null;
  commentCount?: number;
};

export type ColumnDTO = {
  id: string;
  name: string;
  position: number;
  tasks: TaskDTO[];
};

export type MemberDTO = {
  id: string;
  fullName: string;
  username: string;
};

const COLUMN_TINT: Record<string, string> = {
  "To Do": "border-t-slate-400",
  "In Progress": "border-t-sky",
  Review: "border-t-amber-500",
  Done: "border-t-emerald-600",
};

export function KanbanBoard({
  boardId,
  workspaceId,
  initialColumns,
  members,
}: {
  boardId: string;
  workspaceId: string;
  initialColumns: ColumnDTO[];
  members: MemberDTO[];
}) {
  const theme = useTheme();
  const [columns, setColumns] = useState(initialColumns);
  const [activeTask, setActiveTask] = useState<TaskDTO | null>(null);
  const [selected, setSelected] = useState<TaskDTO | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  const refreshBoard = useCallback(async () => {
    const res = await fetch(
      `/hangtuahpm/api/boards?workspaceId=${workspaceId}`
    );
    if (!res.ok) return;
    const data = await res.json();
    const board = data.boards.find((b: { id: string }) => b.id === boardId);
    if (!board) return;
    // re-fetch tasks via a lightweight approach: reload page data
    window.location.reload();
  }, [boardId, workspaceId]);

  useEffect(() => {
    const es = new EventSource(
      `/hangtuahpm/api/events/stream?workspaceId=${workspaceId}`
    );
    es.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data);
        if (event.boardId && event.boardId !== boardId) return;

        if (
          event.type === "task.moved" ||
          event.type === "task.created" ||
          event.type === "task.updated" ||
          event.type === "task.deleted"
        ) {
          // Soft reconcile for moved/updated
          if (event.type === "task.moved" && event.payload) {
            const t = event.payload as TaskDTO;
            setColumns((prev) => {
              const without = prev.map((c) => ({
                ...c,
                tasks: c.tasks.filter((x) => x.id !== t.id),
              }));
              return without.map((c) =>
                c.id === t.columnId
                  ? {
                      ...c,
                      tasks: [...c.tasks, t].sort((a, b) =>
                        a.position < b.position ? -1 : 1
                      ),
                    }
                  : c
              );
            });
          } else if (event.type === "task.updated" && event.payload) {
            const t = event.payload as TaskDTO & {
              comments?: unknown[];
            };
            const commentCount = Array.isArray(t.comments)
              ? t.comments.length
              : undefined;
            setColumns((prev) =>
              prev.map((c) => ({
                ...c,
                tasks: c.tasks.map((x) =>
                  x.id === t.id
                    ? {
                        ...x,
                        ...t,
                        commentCount:
                          commentCount ?? x.commentCount ?? t.commentCount,
                      }
                    : x
                ),
              }))
            );
            setSelected((cur) =>
              cur && cur.id === t.id
                ? {
                    ...cur,
                    ...t,
                    commentCount:
                      commentCount ?? cur.commentCount ?? t.commentCount,
                  }
                : cur
            );
          } else if (event.type === "task.deleted" && event.payload?.id) {
            const id = event.payload.id as string;
            setColumns((prev) =>
              prev.map((c) => ({
                ...c,
                tasks: c.tasks.filter((x) => x.id !== id),
              }))
            );
          } else if (event.type === "task.created" && event.payload) {
            const t = event.payload as TaskDTO;
            setColumns((prev) =>
              prev.map((c) =>
                c.id === t.columnId && !c.tasks.some((x) => x.id === t.id)
                  ? {
                      ...c,
                      tasks: [
                        ...c.tasks,
                        { ...t, commentCount: t.commentCount ?? 0 },
                      ],
                    }
                  : c
              )
            );
          }
        }
      } catch {
        /* ignore */
      }
    };
    return () => es.close();
  }, [workspaceId, boardId]);

  const tasksById = useMemo(() => {
    const map = new Map<string, TaskDTO>();
    columns.forEach((c) => c.tasks.forEach((t) => map.set(t.id, t)));
    return map;
  }, [columns]);

  function findColumnOfTask(taskId: string) {
    return columns.find((c) => c.tasks.some((t) => t.id === taskId));
  }

  function onDragStart(e: DragStartEvent) {
    const t = tasksById.get(String(e.active.id));
    setActiveTask(t || null);
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const fromCol = findColumnOfTask(activeId);
    if (!fromCol) return;

    let toCol = columns.find((c) => c.id === overId);
    let overTaskId: string | null = null;
    if (!toCol) {
      toCol = findColumnOfTask(overId);
      overTaskId = overId;
    }
    if (!toCol) return;

    const fromTasks = [...fromCol.tasks];
    const fromIndex = fromTasks.findIndex((t) => t.id === activeId);
    if (fromIndex < 0) return;
    const [moved] = fromTasks.splice(fromIndex, 1);

    let toTasks =
      fromCol.id === toCol.id ? fromTasks : [...toCol.tasks.filter((t) => t.id !== activeId)];
    let toIndex = overTaskId
      ? toTasks.findIndex((t) => t.id === overTaskId)
      : toTasks.length;
    if (toIndex < 0) toIndex = toTasks.length;

    if (fromCol.id === toCol.id) {
      toTasks = arrayMove(
        [...fromCol.tasks],
        fromIndex,
        toIndex >= fromCol.tasks.length ? toTasks.length : toIndex
      );
    } else {
      toTasks.splice(toIndex, 0, { ...moved, columnId: toCol.id });
    }

    const beforeId = toIndex > 0 ? toTasks[toIndex - 1]?.id ?? null : null;
    const afterId =
      toIndex < toTasks.length - 1 ? toTasks[toIndex + 1]?.id ?? null : null;

    setColumns((prev) =>
      prev.map((c) => {
        if (c.id === fromCol.id && c.id === toCol!.id) {
          return { ...c, tasks: toTasks };
        }
        if (c.id === fromCol.id) {
          return { ...c, tasks: fromTasks };
        }
        if (c.id === toCol!.id) {
          return { ...c, tasks: toTasks };
        }
        return c;
      })
    );

    try {
      const res = await fetch(`/hangtuahpm/api/tasks/${activeId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnId: toCol.id,
          beforeId,
          afterId,
        }),
      });
      if (!res.ok) throw new Error("Move failed");
      const data = await res.json();
      setColumns((prev) =>
        prev.map((c) => ({
          ...c,
          tasks: c.tasks.map((t) =>
            t.id === activeId ? { ...t, ...data.task } : t
          ),
        }))
      );
    } catch {
      toast.error("Could not move task");
      refreshBoard();
    }
  }

  async function createTask(columnId: string) {
    const title = prompt("Task title");
    if (!title) return;
    const res = await fetch("/hangtuahpm/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnId, title }),
    });
    if (!res.ok) {
      toast.error("Could not create task");
      return;
    }
    const data = await res.json();
    setColumns((prev) =>
      prev.map((c) =>
        c.id === columnId ? { ...c, tasks: [...c.tasks, data.task] } : c
      )
    );
  }

  const empty = columns.every((c) => c.tasks.length === 0);

  const placeholders = theme.emptyKanbanUrls;
  const [placeholderIdx, setPlaceholderIdx] = useState(() =>
    Math.floor(Math.random() * placeholders.length)
  );
  useEffect(() => {
    setPlaceholderIdx(Math.floor(Math.random() * placeholders.length));
  }, [empty, placeholders.length]);

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-6 items-start snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tint={COLUMN_TINT[col.name] || "border-t-slate-300"}
              onAdd={() => createTask(col.id)}
              onOpen={(t) => setSelected(t)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} dragging /> : null}
        </DragOverlay>
      </DndContext>

      {empty && (
        <div className="flex flex-col items-center py-12">
          <Image
            key={placeholderIdx}
            src={placeholders[placeholderIdx]}
            alt="Empty board"
            width={320}
            height={420}
            unoptimized
            priority
            className="h-auto w-64 max-w-full object-contain bg-transparent"
          />
          <Button
            className="mt-4"
            onClick={() => columns[0] && createTask(columns[0].id)}
          >
            <Plus className="h-4 w-4" /> Create first task
          </Button>
        </div>
      )}

      {selected && (
        <CardDialog
          task={selected}
          members={members}
          workspaceId={workspaceId}
          open={!!selected}
          onOpenChange={(o) => !o && setSelected(null)}
          onSaved={(t) => {
            setColumns((prev) =>
              prev.map((c) => ({
                ...c,
                tasks: c.tasks.map((x) => (x.id === t.id ? { ...x, ...t } : x)),
              }))
            );
            setSelected(t);
          }}
          onDeleted={(id) => {
            setColumns((prev) =>
              prev.map((c) => ({
                ...c,
                tasks: c.tasks.filter((x) => x.id !== id),
              }))
            );
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
