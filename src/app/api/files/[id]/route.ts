import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import {
  requireSession,
  assertWorkspaceAccess,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/rbac";

function handleError(e: unknown) {
  if (e instanceof UnauthorizedError)
    return NextResponse.json({ error: e.message }, { status: 401 });
  if (e instanceof ForbiddenError)
    return NextResponse.json({ error: e.message }, { status: 403 });
  console.error(e);
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        task: { include: { column: { include: { board: true } } } },
      },
    });
    if (!attachment) throw new ForbiddenError("Not found");
    await assertWorkspaceAccess(
      session,
      attachment.task.column.board.workspaceId
    );

    const data = await readFile(attachment.path);
    return new NextResponse(data, {
      headers: {
        "Content-Type": attachment.mime,
        "Content-Disposition": `inline; filename="${attachment.filename}"`,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
