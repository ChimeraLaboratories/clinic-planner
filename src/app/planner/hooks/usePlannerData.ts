"use client";

import { useEffect, useState } from "react";
import type { PlannerResponse } from "../types/planner";

export function usePlannerData(from: string, to: string, pollMs = 10000) {
    const [data, setData] = useState<PlannerResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function load() {
        try {
            setError(null);
            const res = await fetch(`/planner/api?from=${from}&to=${to}`, { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = (await res.json()) as PlannerResponse;
            setData(json);
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
    }, [from, to, pollMs]);

    return { data, loading, error, reload: load };
}