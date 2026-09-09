"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/brand/Wordmark";
import { useTheme } from "@/components/brand/ThemeProvider";

export default function LoginPage() {
  const theme = useTheme();
  const router = useRouter();
  const search = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/hangtuahpm/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      if (data.mustResetPw) {
        router.push("/reset-password");
        return;
      }
      const next = search.get("next");
      if (next) {
        router.push(next);
      } else if (data.role === "ADMIN") {
        router.push("/admin/users");
      } else if (data.role === "LEADERSHIP") {
        router.push("/dashboard");
      } else {
        router.push("/w");
      }
      router.refresh();
    } catch {
      setError("Unable to reach the court. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:block min-h-[420px] overflow-hidden">
        <Image
          src={theme.loginHeroUrl}
          alt="Basketball court"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          unoptimized={theme.hasCustomLoginHero}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy/85 via-navy/60 to-sky/40" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
          <Image
            src={theme.logoUrl}
            alt="Hangtuah Jakarta"
            width={96}
            height={96}
            unoptimized={theme.hasCustomLogo}
            className="mb-4 drop-shadow-lg"
            priority
          />
          <p className="font-display text-xs tracking-[0.25em] text-sky">
            Rise Stronger
          </p>
          <h2 className="font-display text-3xl tracking-[0.12em] mt-2">
            HANGTUAH PM
          </h2>
        </div>
      </div>
      <div className="flex flex-col justify-center px-4 py-10 sm:px-8 sm:py-12 lg:px-16">
        <Wordmark className="mb-10" priority />
        <h1 className="font-display text-3xl tracking-[0.12em] text-navy mb-2">
          Enter the Court
        </h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Hangtuah Jakarta project management — for The FigHTers behind the
          scenes.
        </p>
        <form onSubmit={onSubmit} className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-fight" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "PREPARING THE COURT…" : "ENTER THE COURT"}
          </Button>
        </form>
        <p className="mt-12 font-display text-xs tracking-[0.2em] text-muted-foreground">
          Rise Stronger
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Hangtuah Jakarta — established 1982. One Team. One City. One Hangtuah.
        </p>
      </div>
    </div>
  );
}
