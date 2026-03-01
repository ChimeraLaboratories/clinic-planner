"use client";

import type { Session } from "../types/planner";
import SessionChip from "./SessionChip";

export default function DayCell({date, inMonth, sessions, onSelect,}: {
    date: Date;
    inMonth: boolean;
    sessions: Session[];
    onSelect: (date: Date) => void;
}) {
    return (
        <button type="button" onClick={() => onSelect(date)}
            className={`h-[140px] border border-slate-200 p-2 relative text-left w-full ${
                inMonth ? "bg-white hover:bg-slate-50" : "bg-slate-50"
            }`}
        >
            <div className="text-xs text-slate-600 mb-2">{inMonth ? date.getDate() : ""}</div>

            <div className="space-y-1">
                {sessions.slice(0, 3).map((s) => (
                    <SessionChip key={String(s.id)} session={s} />
                ))}
                {sessions.length > 3 && (
                    <div className="text-xs text-slate-500">+{sessions.length - 3} more</div>
                )}
            </div>
        </button>
    );
}