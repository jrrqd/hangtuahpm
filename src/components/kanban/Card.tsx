"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PriorityBadge } from "@/components/shell/RoleChip";
import { cn } from "@/lib/utils";
import type { TaskDTO } from "./Board";
import { format } from "date-fns";

export function TaskCard({
  task,
  onClick,
  dragging,
}: {
  task: TaskDTO;
  onClick?: () => void;
  dragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cursor-grab rounded-md border bg-white p-3 shadow-sm active:cursor-grabbing",
        (isDragging || dragging) && "opacity-60 shadow-md ring-2 ring-sky",
        task.priority === "URGENT" &&
          "border-fight/40 bg-[url('/hangtuahpm/brand/priority-urgent-bg.svg')] bg-right-top bg-no-repeat"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(task.dueDate), "MMM d")}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-navy leading-snug">{task.title}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        {task.assignee ? (
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-[10px] font-display text-white">
              {task.assignee.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {task.assignee.fullName}
            </span>
          </div>
        ) : (
          <span />
        )}
        {(task.commentCount ?? 0) > 0 && (
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {task.commentCount} update{(task.commentCount ?? 0) === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </div>
  );
}
