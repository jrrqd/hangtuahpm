"use client";

import { createContext, useContext, useEffect } from "react";
import type { AppTheme } from "@/lib/settings";
import { DEFAULT_COLORS, DEFAULT_IMAGES } from "@/lib/settings";

const defaultTheme: AppTheme = {
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

const ThemeContext = createContext<AppTheme>(defaultTheme);

export function ThemeProvider({
  theme,
  children,
}: {
  theme: AppTheme;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--navy", theme.colorNavy);
    root.style.setProperty("--sky", theme.colorSky);
    root.style.setProperty("--fight", theme.colorFight);
    root.style.setProperty("--primary", theme.colorNavy);
    root.style.setProperty("--secondary", theme.colorSky);
    root.style.setProperty("--accent", theme.colorFight);
    root.style.setProperty("--destructive", theme.colorFight);
    root.style.setProperty("--ring", theme.colorSky);
    root.style.setProperty("--foreground", theme.colorNavy);
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
