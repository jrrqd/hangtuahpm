"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatLastRefreshed, formatWib } from "@/lib/social";

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function SnapshotForm({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const asOf = String(fd.get("capturedAt") || "");
    const capturedAt = asOf ? new Date(asOf).toISOString() : new Date().toISOString();
    const body = {
      capturedAt,
      followers: numOrNull(String(fd.get("followers") || "")),
      following: numOrNull(String(fd.get("following") || "")),
      contentCount: numOrNull(String(fd.get("contentCount") || "")),
      avgLikes: numOrNull(String(fd.get("avgLikes") || "")),
      avgComments: numOrNull(String(fd.get("avgComments") || "")),
      avgViews: numOrNull(String(fd.get("avgViews") || "")),
      sampleSize: numOrNull(String(fd.get("sampleSize") || "")),
      notes: String(fd.get("notes") || "") || null,
      source: "MANUAL" as const,
    };
    try {
      const res = await fetch(
        `/hangtuahpm/api/social/accounts/${accountId}/snapshots`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Add snapshot
      </Button>
    );
  }

  const nowLocal = new Date();
  const localValue = new Date(
    nowLocal.getTime() - nowLocal.getTimezoneOffset() * 60_000
  )
    .toISOString()
    .slice(0, 16);

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-md border p-3 bg-muted/30">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`asof-${accountId}`}>As of (local)</Label>
          <Input
            id={`asof-${accountId}`}
            name="capturedAt"
            type="datetime-local"
            defaultValue={localValue}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`fol-${accountId}`}>Followers</Label>
          <Input id={`fol-${accountId}`} name="followers" type="number" min={0} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`avgL-${accountId}`}>Avg likes</Label>
          <Input id={`avgL-${accountId}`} name="avgLikes" type="number" min={0} step="any" />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`avgC-${accountId}`}>Avg comments</Label>
          <Input id={`avgC-${accountId}`} name="avgComments" type="number" min={0} step="any" />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`avgV-${accountId}`}>Avg views</Label>
          <Input id={`avgV-${accountId}`} name="avgViews" type="number" min={0} step="any" />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`sample-${accountId}`}>Sample size</Label>
          <Input id={`sample-${accountId}`} name="sampleSize" type="number" min={1} defaultValue={12} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`notes-${accountId}`}>Notes</Label>
        <Input id={`notes-${accountId}`} name="notes" placeholder="Optional" />
      </div>
      {error ? <p className="text-sm text-fight">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Saving…" : "Save snapshot"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function AudienceForm({
  accountId,
  initial,
}: {
  accountId: string;
  initial?: {
    primaryLanguage?: string | null;
    inferredGeo?: string | null;
    contentPillars?: string | null;
    fanTone?: string | null;
    strengths?: string | null;
    gaps?: string | null;
    updatedAt?: Date | string | null;
  } | null;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      primaryLanguage: String(fd.get("primaryLanguage") || "") || null,
      inferredGeo: String(fd.get("inferredGeo") || "") || null,
      contentPillars: String(fd.get("contentPillars") || "") || null,
      fanTone: String(fd.get("fanTone") || "") || null,
      strengths: String(fd.get("strengths") || "") || null,
      gaps: String(fd.get("gaps") || "") || null,
    };
    try {
      const res = await fetch(
        `/hangtuahpm/api/social/accounts/${accountId}/audience`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {initial?.updatedAt ? (
        <p className="text-xs text-muted-foreground">
          Audience notes updated: {formatLastRefreshed(initial.updatedAt)}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Primary language</Label>
          <Input
            name="primaryLanguage"
            defaultValue={initial?.primaryLanguage ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label>Inferred geo</Label>
          <Input name="inferredGeo" defaultValue={initial?.inferredGeo ?? ""} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Content pillars</Label>
        <Input
          name="contentPillars"
          defaultValue={initial?.contentPillars ?? ""}
        />
      </div>
      <div className="space-y-1">
        <Label>Fan tone</Label>
        <Input name="fanTone" defaultValue={initial?.fanTone ?? ""} />
      </div>
      <div className="space-y-1">
        <Label>Strengths</Label>
        <Input name="strengths" defaultValue={initial?.strengths ?? ""} />
      </div>
      <div className="space-y-1">
        <Label>Gaps</Label>
        <Input name="gaps" defaultValue={initial?.gaps ?? ""} />
      </div>
      {error ? <p className="text-sm text-fight">{error}</p> : null}
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "Saving…" : "Save audience notes"}
      </Button>
    </form>
  );
}

export function ClubEditForm({
  club,
}: {
  club: {
    id: string;
    name: string;
    city: string;
    notes: string | null;
    accounts: Array<{
      channel: string;
      handle: string | null;
      missing: boolean;
    }>;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const channels = ["INSTAGRAM", "TIKTOK", "X", "YOUTUBE"] as const;
    const accounts = channels.map((channel) => {
      const handle = String(fd.get(`handle_${channel}`) || "").trim();
      return {
        channel,
        handle: handle || null,
        missing: !handle,
      };
    });
    try {
      const res = await fetch("/hangtuahpm/api/social/clubs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: club.id,
          name: String(fd.get("name") || ""),
          city: String(fd.get("city") || ""),
          notes: String(fd.get("notes") || "") || null,
          accounts,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Edit club / handles
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-md border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Name</Label>
          <Input name="name" defaultValue={club.name} required />
        </div>
        <div className="space-y-1">
          <Label>City</Label>
          <Input name="city" defaultValue={club.city} required />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Notes</Label>
        <Input name="notes" defaultValue={club.notes ?? ""} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["INSTAGRAM", "TIKTOK", "X", "YOUTUBE"] as const).map((ch) => {
          const acc = club.accounts.find((a) => a.channel === ch);
          return (
            <div key={ch} className="space-y-1">
              <Label>{ch} handle</Label>
              <Input
                name={`handle_${ch}`}
                placeholder="leave blank if missing"
                defaultValue={acc?.handle ?? ""}
              />
            </div>
          );
        })}
      </div>
      {error ? <p className="text-sm text-fight">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Saving…" : "Save club"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function SnapshotHistory({
  snapshots,
}: {
  snapshots: Array<{
    id: string;
    capturedAt: Date | string;
    recordedAt: Date | string;
    followers: number | null;
    engagementRate: number | null;
    source: string;
  }>;
}) {
  if (!snapshots?.length) return null;
  return (
    <div className="mt-3 space-y-1">
      <p className="text-xs font-display tracking-wider text-muted-foreground">
        Snapshot history
      </p>
      <ul className="text-xs space-y-1 max-h-40 overflow-auto">
        {snapshots.slice(0, 8).map((s) => {
          const cap = formatWib(s.capturedAt);
          const rec = formatWib(s.recordedAt);
          const differ =
            new Date(s.capturedAt).getTime() !==
            new Date(s.recordedAt).getTime();
          return (
            <li key={s.id} className="text-muted-foreground">
              As of {cap}
              {differ ? ` · recorded ${rec}` : ""} ·{" "}
              {s.followers?.toLocaleString() ?? "—"} fol · {s.source}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
