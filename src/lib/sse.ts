import { EventEmitter } from "events";

export type SseEvent = {
  type:
    | "task.created"
    | "task.updated"
    | "task.moved"
    | "task.deleted"
    | "board.updated"
    | "comment.created";
  workspaceId: string;
  boardId?: string;
  payload: unknown;
};

type GlobalBus = { htBus?: EventEmitter };

const g = globalThis as unknown as GlobalBus;

export const bus: EventEmitter =
  g.htBus ||
  (() => {
    const e = new EventEmitter();
    e.setMaxListeners(200);
    g.htBus = e;
    return e;
  })();

export function emitEvent(event: SseEvent) {
  bus.emit("ht", event);
  bus.emit(`ws:${event.workspaceId}`, event);
}

export function subscribeAll(handler: (e: SseEvent) => void) {
  bus.on("ht", handler);
  return () => bus.off("ht", handler);
}

export function subscribeWorkspace(
  workspaceId: string,
  handler: (e: SseEvent) => void
) {
  const key = `ws:${workspaceId}`;
  bus.on(key, handler);
  return () => bus.off(key, handler);
}
