"use client";

import type { PlannerResponse, Session } from "../types/planner";
import { buildMonthGrid, isSameMonth, toISODate } from "../utils/date";
import DayCell from "./DayCell";

function groupByDate(sessions: Session[]) {
    const map = new Map<string, Session[]>();
    for (const s of sessions) {
        const k = s.date;
        const arr = map.get(k) ?? [];
        arr.push(s);
        map.set(k, arr);
    }
    return map;
}

export default function MonthGrid({ anchorMonth, data }: { anchorMonth: Date; data: PlannerResponse }) {
    const days = buildMonthGrid(anchorMonth);
    const sessionsByDate = groupByDate(data.sessions ?? []);
    const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div>
            <div className="grid grid-cols-7 bg-slate-50 border border-slate-200 border-b-0 rounded-t-xl text-sm font-medium text-slate-600">
                {dow.map((d) => (
                    <div key={d} className="px-2 py-2">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {days.filter((d) => isSameMonth(d, anchorMonth)).map((d) => {
                    const iso = toISODate(d);
                    const inMonth = isSameMonth(d, anchorMonth);
                    const sessions = sessionsByDate.get(iso) ?? [];
                    return <DayCell key={d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate()} date={d} inMonth={inMonth} sessions={sessions} />;
                })}
            </div>
        </div>
    );
}