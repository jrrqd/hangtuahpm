import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  requireRole,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/rbac";
import { Role } from "@prisma/client";
import { getAppTheme, getBrandingDir } from "@/lib/settings";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

const ASSET_FIELDS: Record<string, string> = {
  logo: "logoPath",
  loginHero: "loginHeroPath",
  dashboardHero: "dashboardHeroPath",
};

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
    await requireRole(Role.ADMIN);
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const assetType = form.get("assetType") as string | null;

    if (!file || !assetType) {
      return NextResponse.json(
        { error: "file and assetType required" },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Max 5 MB" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, or SVG images allowed" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp", "svg"].includes(ext)
      ? ext
      : "jpg";
    const filename = `${assetType}-${Date.now()}.${safeExt}`;
    const brandingDir = getBrandingDir();
    await mkdir(brandingDir, { recursive: true });
    const dest = path.join(brandingDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(dest, buffer);

    if (assetType === "emptyKanban") {
      const row = await prisma.appSettings.findUnique({
        where: { id: "default" },
      });
      let paths: string[] = [];
      if (row?.emptyKanbanPaths) {
        try {
          paths = JSON.parse(row.emptyKanbanPaths);
        } catch {
          paths = [];
        }
      }
      if (paths.length >= 5) {
        return NextResponse.json(
          { error: "Maximum 5 empty-board images allowed" },
          { status: 400 }
        );
      }
      paths.push(filename);
      await prisma.appSettings.upsert({
        where: { id: "default" },
        create: { id: "default", emptyKanbanPaths: JSON.stringify(paths) },
        update: { emptyKanbanPaths: JSON.stringify(paths) },
      });
    } else {
      const field = ASSET_FIELDS[assetType];
      if (!field) {
        return NextResponse.json({ error: "Invalid assetType" }, { status: 400 });
      }
      await prisma.appSettings.upsert({
        where: { id: "default" },
        create: { id: "default", [field]: filename },
        update: { [field]: filename },
      });
    }

    const theme = await getAppTheme();
    return NextResponse.json({ theme });
  } catch (e) {
    return handleError(e);
  }
}
