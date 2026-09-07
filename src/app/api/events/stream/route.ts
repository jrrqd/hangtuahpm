import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { assertWorkspaceAccess } from "@/lib/rbac";
import { subscribeAll, subscribeWorkspace, SseEvent } from "@/lib/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  const scope = searchParams.get("scope");

  if (scope === "all") {
    if (session.role !== Role.ADMIN && session.role !== Role.LEADERSHIP) {
      return new Response("Forbidden", { status: 403 });
    }
  } else if (workspaceId) {
    try {
      await assertWorkspaceAccess(session, workspaceId);
    } catch {
      return new Response("Forbidden", { status: 403 });
    }
  } else {
    return new Response("workspaceId or scope=all required", { status: 400 });
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: SseEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          /* closed */
        }
      };

      cleanup =
        scope === "all"
          ? subscribeAll(send)
          : subscribeWorkspace(workspaceId!, send);

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          /* closed */
        }
      }, 25000);

      req.signal.addEventListener("abort", () => {
        if (heartbeat) clearInterval(heartbeat);
        cleanup?.();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
