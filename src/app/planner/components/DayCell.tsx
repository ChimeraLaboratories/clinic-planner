"use client";

import type { Session } from "../types/planner";
import SessionChip from "./SessionChip";

export default function DayCell({
                                    date,
                                    inMonth,
                                    sessions,
                                }: {
    date: Date;
    inMonth: boolean;
    sessions: Session[];
}) {
    return (
        <div className={`min-h-[110px] border-t border-l p-2 ${inMonth ? "bg-white" : "bg-slate-50"}`}>
    <div className="text-xs text-slate-600 mb-2">{date.getDate()}</div>

        <div className="space-y-1">
        {sessions.slice(0, 3).map((s) => (
                <SessionChip key={String(s.id)} session={s} />
))}
    {sessions.length > 3 && <div className="text-xs text-slate-500">+{sessions.length - 3} more</div>}
    </div>
    </div>
    );
    }