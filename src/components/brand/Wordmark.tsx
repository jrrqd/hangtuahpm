"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/brand/ThemeProvider";

export function Wordmark({
  className,
  light = false,
  priority = false,
}: {
  className?: string;
  light?: boolean;
  priority?: boolean;
}) {
  const theme = useTheme();
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src={theme.logoUrl}
        alt="Hangtuah Jakarta"
        width={36}
        height={36}
        unoptimized={theme.hasCustomLogo}
        className="shrink-0"
        priority={priority}
      />
      <div className="leading-none">
        <div
          className={cn(
            "font-display text-lg tracking-[0.12em]",
            light ? "text-white" : "text-navy"
          )}
        >
          HANGTUAH
        </div>
        <div className="font-display text-[10px] tracking-[0.2em] text-sky">
          JAKARTA · PM
        </div>
      </div>
    </div>
  );
}
