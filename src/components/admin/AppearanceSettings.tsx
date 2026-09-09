"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RotateCcw, Upload, X } from "lucide-react";
import type { AppTheme } from "@/lib/settings";
type ColorKey = "colorNavy" | "colorSky" | "colorFight";

const COLOR_LABELS: Record<ColorKey, string> = {
  colorNavy: "Navy (primary)",
  colorSky: "Sky (accent)",
  colorFight: "Fight Red",
};

export function AppearanceSettings({ initialTheme }: { initialTheme: AppTheme }) {
  const [theme, setTheme] = useState(initialTheme);
  const [colors, setColors] = useState({
    colorNavy: initialTheme.colorNavy,
    colorSky: initialTheme.colorSky,
    colorFight: initialTheme.colorFight,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const logoRef = useRef<HTMLInputElement>(null);
  const loginRef = useRef<HTMLInputElement>(null);
  const dashboardRef = useRef<HTMLInputElement>(null);
  const emptyRef = useRef<HTMLInputElement>(null);

  async function saveColors() {
    setSaving(true);
    try {
      const res = await fetch("/hangtuahpm/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(colors),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTheme(data.theme);
      toast.success("Colors saved");
    } catch {
      toast.error("Could not save colors");
    } finally {
      setSaving(false);
    }
  }

  async function resetColors() {
    setSaving(true);
    try {
      const res = await fetch("/hangtuahpm/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetColors: true }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTheme(data.theme);
      setColors({
        colorNavy: data.theme.colorNavy,
        colorSky: data.theme.colorSky,
        colorFight: data.theme.colorFight,
      });
      toast.success("Colors reset to defaults");
    } catch {
      toast.error("Could not reset colors");
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(assetType: string, file: File) {
    setUploading(assetType);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("assetType", assetType);
      const res = await fetch("/hangtuahpm/api/settings/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      setTheme(data.theme);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function clearImage(
    key: "clearLogo" | "clearLoginHero" | "clearDashboardHero" | "clearEmptyKanban"
  ) {
    try {
      const res = await fetch("/hangtuahpm/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: true }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTheme(data.theme);
      toast.success("Reset to default image");
    } catch {
      toast.error("Could not reset image");
    }
  }

  async function removeEmptyImage(index: number) {
    try {
      const res = await fetch("/hangtuahpm/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeEmptyKanbanIndex: index }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTheme(data.theme);
      toast.success("Image removed");
    } catch {
      toast.error("Could not remove image");
    }
  }

  function handleFileInput(
    assetType: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (file) uploadImage(assetType, file);
    e.target.value = "";
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl tracking-[0.12em] text-navy">
          Appearance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize brand colors and images across the app.
        </p>
      </div>

      {/* Colors */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-sm tracking-wider text-navy">
            Color theme
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={resetColors}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="h-4 w-4" /> Reset colors
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {(Object.keys(COLOR_LABELS) as ColorKey[]).map((key) => (
            <div key={key} className="space-y-2">
              <Label>{COLOR_LABELS[key]}</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={colors[key]}
                  onChange={(e) =>
                    setColors((c) => ({ ...c, [key]: e.target.value }))
                  }
                  className="h-10 w-12 shrink-0 cursor-pointer rounded border"
                />
                <Input
                  value={colors[key]}
                  onChange={(e) =>
                    setColors((c) => ({ ...c, [key]: e.target.value }))
                  }
                  className="font-mono text-sm"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 rounded-md border p-4">
          <div
            className="h-12 flex-1 rounded"
            style={{ backgroundColor: colors.colorNavy }}
          />
          <div
            className="h-12 flex-1 rounded"
            style={{ backgroundColor: colors.colorSky }}
          />
          <div
            className="h-12 flex-1 rounded"
            style={{ backgroundColor: colors.colorFight }}
          />
        </div>
        <Button onClick={saveColors} disabled={saving}>
          {saving ? "Saving…" : "Save colors"}
        </Button>
      </section>

      {/* Images */}
      <section className="space-y-6">
        <h2 className="font-display text-sm tracking-wider text-navy">
          Brand images
        </h2>

        <ImageSlot
          label="Logo"
          src={theme.logoUrl}
          isCustom={theme.hasCustomLogo}
          uploading={uploading === "logo"}
          onUpload={() => logoRef.current?.click()}
          onClear={() => clearImage("clearLogo")}
          inputRef={logoRef}
          onChange={(e) => handleFileInput("logo", e)}
          hint="Shown in sidebar and login. Square works best."
        />

        <ImageSlot
          label="Login hero"
          src={theme.loginHeroUrl}
          isCustom={theme.hasCustomLoginHero}
          uploading={uploading === "loginHero"}
          onUpload={() => loginRef.current?.click()}
          onClear={() => clearImage("clearLoginHero")}
          inputRef={loginRef}
          onChange={(e) => handleFileInput("loginHero", e)}
          hint="Background on the login page (desktop)."
          wide
        />

        <ImageSlot
          label="Dashboard hero"
          src={theme.dashboardHeroUrl}
          isCustom={theme.hasCustomDashboardHero}
          uploading={uploading === "dashboardHero"}
          onUpload={() => dashboardRef.current?.click()}
          onClear={() => clearImage("clearDashboardHero")}
          inputRef={dashboardRef}
          onChange={(e) => handleFileInput("dashboardHero", e)}
          hint="Banner on the Fight Night dashboard."
          wide
        />

        <div className="space-y-3 rounded-md border p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label>Empty board placeholders</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Shown when a kanban board has no tasks (up to 5, rotates
                randomly).
              </p>
            </div>
            <div className="flex gap-2">
              {theme.customEmptyKanbanCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearImage("clearEmptyKanban")}
                >
                  Reset all
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => emptyRef.current?.click()}
                disabled={
                  uploading === "emptyKanban" ||
                  theme.emptyKanbanUrls.length >= 5
                }
              >
                <Upload className="h-4 w-4" />
                {uploading === "emptyKanban" ? "Uploading…" : "Add image"}
              </Button>
            </div>
          </div>
          <input
            ref={emptyRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFileInput("emptyKanban", e)}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {theme.emptyKanbanUrls.map((url, i) => (
              <div key={url} className="relative group">
                <Image
                  src={url}
                  alt={`Placeholder ${i + 1}`}
                  width={120}
                  height={160}
                  unoptimized
                  className="h-24 w-full rounded object-contain border bg-transparent"
                />
                {theme.customEmptyKanbanCount > 0 && (
                  <button
                    type="button"
                    onClick={() => removeEmptyImage(i)}
                    className="absolute -top-2 -right-2 rounded-full bg-fight p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ImageSlot({
  label,
  src,
  isCustom,
  uploading,
  onUpload,
  onClear,
  inputRef,
  onChange,
  hint,
  wide,
}: {
  label: string;
  src: string;
  isCustom: boolean;
  uploading: boolean;
  onUpload: () => void;
  onClear: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hint: string;
  wide?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 rounded-md border p-4">
      <div className={wide ? "sm:w-48 shrink-0" : "sm:w-24 shrink-0"}>
        <Image
          src={src}
          alt={label}
          width={wide ? 192 : 96}
          height={wide ? 108 : 96}
          unoptimized
          className={`rounded border object-cover ${wide ? "h-24 w-full" : "h-24 w-24"}`}
        />
      </div>
      <div className="flex-1 space-y-2">
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
        {isCustom && (
          <p className="text-xs text-sky font-medium">Custom image active</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onUpload}
            disabled={uploading}
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload"}
          </Button>
          {isCustom && (
            <Button size="sm" variant="ghost" onClick={onClear}>
              Use default
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="hidden"
          onChange={onChange}
        />
      </div>
    </div>
  );
}
