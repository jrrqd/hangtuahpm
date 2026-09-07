import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { RiseStrongerIcon } from "@/components/icons/Icons";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted px-4 text-center">
      <Wordmark className="mb-8" />
      <RiseStrongerIcon className="h-10 w-10 text-fight mb-4" />
      <h1 className="font-display text-3xl tracking-[0.12em] text-navy mb-2">
        Off the Court
      </h1>
      <p className="text-muted-foreground mb-6">Page not found.</p>
      <Link
        href="/login"
        className="font-display text-sm tracking-wider text-sky hover:underline"
      >
        Back to login
      </Link>
    </div>
  );
}
