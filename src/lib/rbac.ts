import { Role } from "@prisma/client";
import { getSession, SessionPayload } from "./auth";
import { prisma } from "./prisma";

export class ForbiddenError extends Error {
  status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  status = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

export async function requireRole(
  ...allowed: Role[]
): Promise<SessionPayload> {
  const session = await requireSession();
  if (!allowed.includes(session.role)) throw new ForbiddenError();
  return session;
}

export async function assertWorkspaceAccess(
  session: SessionPayload,
  workspaceId: string
): Promise<void> {
  if (session.role === Role.ADMIN || session.role === Role.LEADERSHIP) return;
  const ok = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.userId, workspaceId },
    },
  });
  if (!ok) throw new ForbiddenError("No access to this workspace");
}

export async function assertBoardAccess(
  session: SessionPayload,
  boardId: string
): Promise<{ workspaceId: string }> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true },
  });
  if (!board) throw new ForbiddenError("Board not found");
  await assertWorkspaceAccess(session, board.workspaceId);
  return board;
}

export async function getAccessibleWorkspaces(session: SessionPayload) {
  if (session.role === Role.ADMIN || session.role === Role.LEADERSHIP) {
    return prisma.workspace.findMany({ orderBy: { name: "asc" } });
  }
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.userId },
    include: { workspace: true },
  });
  return memberships.map((m) => m.workspace);
}

export function canSeeDashboard(role: Role) {
  return role === Role.ADMIN || role === Role.LEADERSHIP;
}

export function canAdmin(role: Role) {
  return role === Role.ADMIN;
}
