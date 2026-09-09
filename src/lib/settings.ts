import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const DEFAULT_COLORS = {
  colorNavy: "#0B1F3A",
  colorSky: "#0F8BF6",
  colorFight: "#C8102E",
} as const;

export const DEFAULT_IMAGES = {
  logo: "/hangtuahpm/brand/logo.png",
  loginHero: "/hangtuahpm/brand/login-hero.jpg",
  dashboardHero: "/hangtuahpm/brand/dashboard-hero.jpg",
  emptyKanban: [
    "/hangtuahpm/brand/empty-kanban/player-1.png",
    "/hangtuahpm/brand/empty-kanban/player-2.png",
    "/hangtuahpm/brand/empty-kanban/player-3.png",
  ],
} as const;

export type AppTheme = {
  colorNavy: string;
  colorSky: string;
  colorFight: string;
  logoUrl: string;
  loginHeroUrl: string;
  dashboardHeroUrl: string;
  emptyKanbanUrls: string[];
  hasCustomLogo: boolean;
  hasCustomLoginHero: boolean;
  hasCustomDashboardHero: boolean;
  customEmptyKanbanCount: number;
};

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function isValidHexColor(value: string) {
  return HEX_RE.test(value);
}

function brandAssetUrl(filename: string | null | undefined, fallback: string) {
  if (!filename) return fallback;
  return `/hangtuahpm/api/settings/brand/${filename}`;
}

function parseEmptyPaths(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((p): p is string => typeof p === "string")
      : [];
  } catch {
    return [];
  }
}

function defaultTheme(): AppTheme {
  return {
    ...DEFAULT_COLORS,
    logoUrl: DEFAULT_IMAGES.logo,
    loginHeroUrl: DEFAULT_IMAGES.loginHero,
    dashboardHeroUrl: DEFAULT_IMAGES.dashboardHero,
    emptyKanbanUrls: [...DEFAULT_IMAGES.emptyKanban],
    hasCustomLogo: false,
    hasCustomLoginHero: false,
    hasCustomDashboardHero: false,
    customEmptyKanbanCount: 0,
  };
}

export const getAppTheme = cache(async (): Promise<AppTheme> => {
  try {
    const row = await prisma.appSettings.findUnique({ where: { id: "default" } });
    if (!row) return defaultTheme();
    const customEmpty = parseEmptyPaths(row.emptyKanbanPaths);

    return {
    colorNavy: row?.colorNavy ?? DEFAULT_COLORS.colorNavy,
    colorSky: row?.colorSky ?? DEFAULT_COLORS.colorSky,
    colorFight: row?.colorFight ?? DEFAULT_COLORS.colorFight,
    logoUrl: brandAssetUrl(row?.logoPath, DEFAULT_IMAGES.logo),
    loginHeroUrl: brandAssetUrl(row?.loginHeroPath, DEFAULT_IMAGES.loginHero),
    dashboardHeroUrl: brandAssetUrl(
      row?.dashboardHeroPath,
      DEFAULT_IMAGES.dashboardHero
    ),
    emptyKanbanUrls:
      customEmpty.length > 0
        ? customEmpty.map((p) => brandAssetUrl(p, ""))
        : [...DEFAULT_IMAGES.emptyKanban],
    hasCustomLogo: !!row?.logoPath,
    hasCustomLoginHero: !!row?.loginHeroPath,
    hasCustomDashboardHero: !!row.dashboardHeroPath,
    customEmptyKanbanCount: customEmpty.length,
  };
  } catch {
    return defaultTheme();
  }
});

export function getBrandingDir() {
  const base = process.env.UPLOAD_DIR || "./uploads";
  return `${base}/branding`;
}
