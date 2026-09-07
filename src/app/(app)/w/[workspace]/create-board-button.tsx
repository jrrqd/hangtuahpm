"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function CreateBoardButton({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const params = useParams<{ workspace: string }>();
  const [loading, setLoading] = useState(false);

  async function create() {
    const name = prompt("Board name", "Sprint Board");
    if (!name) return;
    setLoading(true);
    try {
      const res = await fetch("/hangtuahpm/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, name }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success("Board created");
      router.push(`/w/${params.workspace}/b/${data.board.id}`);
      router.refresh();
    } catch {
      toast.error("Could not create board");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={create} disabled={loading}>
      <Plus className="h-4 w-4" /> New board
    </Button>
  );
}
