import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  requireRole,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/rbac";
import { Role } from "@prisma/client";
import {
  DEFAULT_COLORS,
  getAppTheme,
  isValidHexColor,
} from "@/lib/settings";

function handleError(e: unknown) {
  if (e instanceof UnauthorizedError)
    return NextResponse.json({ error: e.message }, { status: 401 });
  if (e instanceof ForbiddenError)
    return NextResponse.json({ error: e.message }, { status: 403 });
  console.error(e);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}

export async function GET() {
  try {
    const theme = await getAppTheme();
    return NextResponse.json({ theme });
  } catch (e) {
    return handleError(e);
  }
}

const patchSchema = z.object({
  colorNavy: z.string().optional(),
  colorSky: z.string().optional(),
  colorFight: z.string().optional(),
  resetColors: z.boolean().optional(),
  clearLogo: z.boolean().optional(),
  clearLoginHero: z.boolean().optional(),
  clearDashboardHero: z.boolean().optional(),
  clearEmptyKanban: z.boolean().optional(),
  removeEmptyKanbanIndex: z.number().int().min(0).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    await requireRole(Role.ADMIN);
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const data = parsed.data;
    const update: Record<string, string | null> = {};

    if (data.resetColors) {
      update.colorNavy = DEFAULT_COLORS.colorNavy;
      update.colorSky = DEFAULT_COLORS.colorSky;
      update.colorFight = DEFAULT_COLORS.colorFight;
    } else {
      for (const key of ["colorNavy", "colorSky", "colorFight"] as const) {
        const value = data[key];
        if (value !== undefined) {
          if (!isValidHexColor(value)) {
            return NextResponse.json(
              { error: `${key} must be a hex color like #0B1F3A` },
              { status: 400 }
            );
          }
          update[key] = value;
        }
      }
    }

    if (data.clearLogo) update.logoPath = null;
    if (data.clearLoginHero) update.loginHeroPath = null;
    if (data.clearDashboardHero) update.dashboardHeroPath = null;
    if (data.clearEmptyKanban) update.emptyKanbanPaths = null;

    if (data.removeEmptyKanbanIndex !== undefined) {
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
      paths.splice(data.removeEmptyKanbanIndex, 1);
      update.emptyKanbanPaths =
        paths.length > 0 ? JSON.stringify(paths) : null;
    }

    await prisma.appSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        colorNavy: update.colorNavy ?? DEFAULT_COLORS.colorNavy,
        colorSky: update.colorSky ?? DEFAULT_COLORS.colorSky,
        colorFight: update.colorFight ?? DEFAULT_COLORS.colorFight,
        logoPath: update.logoPath ?? null,
        loginHeroPath: update.loginHeroPath ?? null,
        dashboardHeroPath: update.dashboardHeroPath ?? null,
        emptyKanbanPaths: update.emptyKanbanPaths ?? null,
      },
      update,
    });

    const theme = await getAppTheme();
    return NextResponse.json({ theme });
  } catch (e) {
    return handleError(e);
  }
}
