"use client";

import { useMemo, useState } from "react";
import PlannerShell from "../components/PlannerShell";
import { endOfMonth, startOfMonth, toISODate } from "../utils/date";
import { usePlannerData } from "../hooks/usePlannerData";

export default function PlannerController() {
    const [anchorMonth, setAnchorMonth] = useState(() => new Date());

    const { from, to } = useMemo(() => {
        return {
            from: toISODate(startOfMonth(anchorMonth)),
            to: toISODate(endOfMonth(anchorMonth)),
        };
    }, [anchorMonth]);

    const { data, loading, error } = usePlannerData(from, to, 10000);

    return (
        <PlannerShell
            anchorMonth={anchorMonth}
    onPrevMonth={() => setAnchorMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
    onNextMonth={() => setAnchorMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
    data={data}
    loading={loading}
    error={error}
    />
);
}