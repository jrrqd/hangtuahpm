import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  requireSession,
  assertWorkspaceAccess,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/rbac";

const MAX_SIZE = 10 * 1024 * 1024;

function handleError(e: unknown) {
  if (e instanceof UnauthorizedError)
    return NextResponse.json({ error: e.message }, { status: 401 });
  if (e instanceof ForbiddenError)
    return NextResponse.json({ error: e.message }, { status: 403 });
  console.error(e);
  return NextResponse.json({ error: "Upload failed" }, { status: 500 });
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const taskId = form.get("taskId") as string | null;

    if (!file || !taskId) {
      return NextResponse.json(
        { error: "file and taskId required" },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Max 10 MB" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { column: { include: { board: true } } },
    });
    if (!task) throw new ForbiddenError("Task not found");
    await assertWorkspaceAccess(session, task.column.board.workspaceId);

    const uploadDir = process.env.UPLOAD_DIR || "./uploads";
    await mkdir(uploadDir, { recursive: true });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${safeName}`;
    const dest = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(dest, buffer);

    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        filename: file.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
        path: dest,
      },
    });

    return NextResponse.json({ attachment });
  } catch (e) {
    return handleError(e);
  }
}
