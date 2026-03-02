"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import PlannerShell from "../components/PlannerShell";
import { endOfMonth, startOfMonth, toISODate } from "../utils/date";
import { usePlannerData } from "../hooks/usePlannerData";

function ym(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
}

function parseYm(s: string | null): Date | null {
    if (!s) return null;
    const m = /^(\d{4})-(\d{2})$/.exec(s);
    if (!m) return null;

    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;

    if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 0 || mo > 11) return null;
    return new Date(y, mo, 1);
}

function monthStart(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function PlannerController() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // ✅ Initialise from URL (?m=YYYY-MM), otherwise sessionStorage, otherwise now
    const [anchorMonth, setAnchorMonth] = useState<Date>(() => {
        const fromUrl = parseYm(searchParams.get("m"));
        if (fromUrl) return fromUrl;

        if (typeof window !== "undefined") {
            const saved = window.sessionStorage.getItem("planner:lastMonth");
            const fromStore = parseYm(saved);
            if (fromStore) return fromStore;
        }

        return monthStart(new Date());
    });

    // ✅ Keep anchorMonth in sync if user lands on /planner?m=...
    useEffect(() => {
        const fromUrl = parseYm(searchParams.get("m"));
        if (!fromUrl) return;

        // Only update state if it's actually different (prevents loops)
        const cur = monthStart(anchorMonth);
        const next = monthStart(fromUrl);

        if (cur.getFullYear() !== next.getFullYear() || cur.getMonth() !== next.getMonth()) {
            setAnchorMonth(next);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // ✅ Whenever anchorMonth changes, persist it and reflect it in the URL
    useEffect(() => {
        const m = ym(anchorMonth);

        if (typeof window !== "undefined") {
            window.sessionStorage.setItem("planner:lastMonth", m);
        }

        // Update URL without scrolling/reload
        router.replace(`/planner?m=${m}`, { scroll: false });
    }, [anchorMonth, router]);

    const { from, to } = useMemo(() => {
        return {
            from: toISODate(startOfMonth(anchorMonth)),
            to: toISODate(endOfMonth(anchorMonth)),
        };
    }, [anchorMonth]);

    const { data, loading, error, reload } = usePlannerData(from, to, 10000);

    return (
        <PlannerShell
            anchorMonth={anchorMonth}
            onPrevMonth={() => setAnchorMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            onNextMonth={() => setAnchorMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            onSetMonth={(d) => setAnchorMonth(new Date(d.getFullYear(), d.getMonth(), 1))}
            data={data}
            loading={loading}
            error={error}
            onRefresh={reload}
        />
    );
}