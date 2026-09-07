import { Role, Priority } from "@prisma/client";
import { cn } from "@/lib/utils";

const roleStyles: Record<Role, string> = {
  ADMIN: "bg-fight/10 text-fight border-fight/30",
  LEADERSHIP: "bg-sky/10 text-sky border-sky/30",
  STAFF: "bg-slate-100 text-slate-600 border-slate-200",
};

export function RoleChip({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 font-display text-[10px] tracking-wider",
        roleStyles[role]
      )}
    >
      {role}
    </span>
  );
}

const priorityStyles: Record<Priority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-sky/15 text-sky",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-fight/15 text-fight",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 font-display text-[10px] tracking-wider",
        priorityStyles[priority]
      )}
    >
      {priority}
    </span>
  );
}
