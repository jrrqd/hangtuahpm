import Image from "next/image";
import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  light = false,
  priority = false,
}: {
  className?: string;
  light?: boolean;
  priority?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/hangtuahpm/brand/logo.png"
        alt="Hangtuah Jakarta"
        width={36}
        height={36}
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
