"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskCard } from "./Card";
import type { ColumnDTO, TaskDTO } from "./Board";

export function KanbanColumn({
  column,
  tint,
  onAdd,
  onOpen,
}: {
  column: ColumnDTO;
  tint: string;
  onAdd: () => void;
  onOpen: (t: TaskDTO) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      className={cn(
        "w-72 shrink-0 rounded-md border bg-muted/40 border-t-4",
        tint,
        isOver && "ring-2 ring-sky"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="font-display text-xs tracking-wider text-navy">
          {column.name}
          <span className="ml-2 font-stat text-muted-foreground">
            {column.tasks.length}
          </span>
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="rounded p-1 text-muted-foreground hover:bg-white hover:text-navy"
          aria-label="Add task"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div ref={setNodeRef} className="min-h-[120px] space-y-2 px-2 pb-3">
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onOpen(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
