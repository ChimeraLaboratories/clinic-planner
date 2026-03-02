"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlannerResponse } from "../types/planner";

function ymd(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function monthBoundsFromTo(to: string) {
    // expects to like "2026-04-29" or "2026-04-29T..."
    const y = Number(String(to).slice(0, 4));
    const m = Number(String(to).slice(5, 7)); // 1..12
    if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return null;

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0); // last day of month
    return { from: ymd(start), to: ymd(end) };
}

export function usePlannerData(from: string, to: string, pollMs = 10000) {
    const [data, setData] = useState<PlannerResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [syncState, setSyncState] = useState<"idle" | "syncing" | "synced" | "error">("idle");
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

    useEffect(() => {
        if (syncState !== "synced") return;

        const t = setTimeout(() => setSyncState("idle"), 2500);
        return () => clearTimeout(t);
    }, [syncState]);

    // ✅ normalize to full month based on the month you're viewing (derived from `to`)
    const normalized = useMemo(() => {
        const b = monthBoundsFromTo(to);
        return b ?? { from, to };
    }, [from, to]);

    async function load() {
        try {
            setError(null);
            setSyncState("syncing");

            console.log("[usePlannerData] fetching", normalized);

            const res = await fetch(
                `/planner/api/planner?from=${normalized.from}&to=${normalized.to}`,
                { cache: "no-store" }
            );

            console.log("[usePlannerData] status", res.status);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = (await res.json()) as PlannerResponse;

            console.log("[usePlannerData] payload sizes", {
                rooms: json?.rooms?.length,
                clinicians: json?.clinicians?.length,
                sessions: json?.sessions?.length,
            });

            setData(json);
            setLastSyncedAt(new Date());
            setSyncState("synced");
        } catch (e: any) {
            setError(e?.message ?? "Failed to load");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setLoading(true);
        load();
        const t = setInterval(load, pollMs);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [normalized.from, normalized.to, pollMs]);

    return { data, loading, error, syncState, lastSyncedAt, reload: load };
}