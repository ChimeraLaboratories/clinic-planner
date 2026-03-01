"use client";

import type { PlannerResponse, Session } from "../types/planner";
import { buildMonthGrid, isSameMonth, toISODate } from "../utils/date";
import DayCell from "./DayCell";
import DayDrawer from "@/app/planner/components/DayDrawer";
import {useMemo, useState} from "react";

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

export default function MonthGrid({ anchorMonth, data, onRefresh, }: { anchorMonth: Date; data: PlannerResponse; onRefresh: () => void | Promise<void>; }) {
    const days = buildMonthGrid(anchorMonth);
    const sessionsByDate = groupByDate(data.sessions ?? []);
    const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const totalRooms = data.rooms?.length ?? 0;

    const roomsById = useMemo(() => {
        const m = new Map<number, string>();
        for (const r of data.rooms) {
            m.set(Number(r.id), String(r.name)); // ✅ force number key + string value
        }
        return m;
    }, [data.rooms]);

    const cliniciansById = useMemo(() => {
        const m = new Map<number, string>();
        for (const c of data.clinicians) {
            // ✅ ensure it's never undefined
            const label = c.display_name ?? c.full_name ?? `Clinician ${c.id}`;
            m.set(Number(c.id), String(label));
        }
        return m;
    }, [data.clinicians]);

    const sessionsByDay = useMemo(() => {
        const map: Record<string, any[]> = {};
        for (const s of (data?.sessions ?? []) as any[]) {
            const key = String(s.date ?? s.session_date ?? "").slice(0, 10); // ✅ critical
            (map[key] ??= []).push(s);
        }
        return map;
    }, [data?.sessions]);

    function dayKeyLocal(d: Date) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const selectedIso = selectedDate ? toISODate(selectedDate) : null;
    const selectedSessions = selectedIso ? sessionsByDate.get(selectedIso) ?? [] : [];

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
                {days.map((d) => {
                    const iso = toISODate(d);
                    const inMonth = isSameMonth(d, anchorMonth);
                    const sessions = sessionsByDate.get(iso) ?? [];
                    return (
                        <DayCell
                            key={d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate()}
                            date={d}
                            inMonth={inMonth}
                            sessions={(sessionsByDay[dayKeyLocal(d)] ?? []) as any}
                            totalRooms={data?.rooms?.length ?? 0}
                            roomsById={roomsById}
                            cliniciansById={cliniciansById}
                            onSelect={(date) => setSelectedDate(date)}
                        />
                    );
                })}
            </div>

            <DayDrawer
                open={!!selectedDate}
                date={selectedDate}
                sessions={selectedSessions}
                roomsById={roomsById}
                cliniciansById={cliniciansById}
                onClose={() => setSelectedDate(null)}
                onRefresh={onRefresh}
            />
        </div>
    );
}