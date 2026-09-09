"use client";

import Image from "next/image";
import { useTheme } from "@/components/brand/ThemeProvider";

export function DashboardHero() {
  const theme = useTheme();
  return (
    <div className="relative min-h-[220px] text-white overflow-hidden">
      <Image
        src={theme.dashboardHeroUrl}
        alt=""
        fill
        priority
        sizes="100vw"
        unoptimized={theme.hasCustomDashboardHero}
        className="object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/65 to-transparent" />
      <div className="relative px-4 py-8 sm:px-8 sm:py-12">
        <p className="font-display text-xs tracking-[0.25em] text-sky mb-2">
          Leadership view
        </p>
        <h1 className="font-display text-3xl md:text-4xl tracking-[0.12em]">
          Fight Night
        </h1>
        <p className="mt-2 text-white/85 text-sm max-w-xl">
          Cross-workspace view of everything in motion across Marketing,
          Merchandiser, and Creative.
        </p>
      </div>
    </div>
  );
}
