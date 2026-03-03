"use client";

import type { PlannerResponse, Session } from "../types/planner";
import {
    buildMonthGrid,
    getFirstFullWeekend,
    isSameMonth,
    toISODate,
} from "../utils/date";
import DayCell from "./DayCell";
import DayDrawer from "@/app/planner/components/DayDrawer";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function ymdLocal(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function dateKeyFromAny(input: any): string {
    if (!input) return "";

    // ✅ IMPORTANT: mysql2 can return Date objects; use LOCAL YMD to match month grid keys
    if (input instanceof Date) return ymdLocal(input);

    const s = String(input).trim();
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : "";
}

function groupByDate(sessions: Session[]) {
    const map = new Map<string, Session[]>();
    for (const s of sessions) {
        const k = dateKeyFromAny(
            (s as any).date ?? (s as any).session_date ?? (s as any).sessionDate
        );
        if (!k) continue;
        const arr = map.get(k) ?? [];
        arr.push(s);
        map.set(k, arr);
    }
    return map;
}

function ym(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
}

function buildTrainingKeys(anchorMonth: Date) {
    const year = anchorMonth.getFullYear();
    const month = anchorMonth.getMonth();

    const wk = getFirstFullWeekend(year, month);
    if (!wk) return new Set<string>();

    const sat = new Date(year, month, wk.saturday);
    const sun = new Date(year, month, wk.sunday);

    return new Set([toISODate(sat), toISODate(sun)]);
}

export default function MonthGrid({
                                      anchorMonth,
                                      data,
                                      onRefresh,
                                  }: {
    anchorMonth: Date;
    data: PlannerResponse;
    onRefresh: () => void | Promise<void>;
}) {
    const router = useRouter();

    const monthParam = ym(anchorMonth);
    const days = buildMonthGrid(anchorMonth);
    const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const totalRooms = data.rooms?.length ?? 0;

    const trainingKeys = useMemo(
        () => buildTrainingKeys(anchorMonth),
        [anchorMonth]
    );

    const roomsById = useMemo(() => {
        const m = new Map<number, string>();
        for (const r of (data?.rooms ?? []) as any[]) {
            m.set(Number(r.id), String(r.name));
        }
        return m;
    }, [data]);

    const cliniciansById = useMemo(() => {
        const m = new Map<number, string>();
        for (const c of (data?.clinicians ?? []) as any[]) {
            m.set(Number(c.id), String(c.full_name ?? c.display_name ?? ""));
        }
        return m;
    }, [data]);

    // ✅ Single source of truth for sessions keyed by LOCAL YYYY-MM-DD
    const sessionsByDay = useMemo(() => {
        const map: Record<string, any[]> = {};
        for (const s of (data?.sessions ?? []) as any[]) {
            const key = dateKeyFromAny(s.date ?? s.session_date ?? s.sessionDate);
            if (!key) continue;
            (map[key] ??= []).push(s);
        }
        return map;
    }, [data?.sessions]);

    // Drawer support (still uses same local keying)
    const sessionsByDate = useMemo(
        () => groupByDate((data.sessions ?? []) as Session[]),
        [data.sessions]
    );

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const selectedIso = selectedDate ? ymdLocal(selectedDate) : null;
    const selectedSessions = selectedIso
        ? sessionsByDate.get(selectedIso) ?? []
        : [];

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
                    const dateKey = ymdLocal(d); // ✅ local YYYY-MM-DD
                    const inMonth = isSameMonth(d, anchorMonth);

                    return (
                        <DayCell
                            key={dateKey}
                            date={d}
                            dateKey={dateKey}
                            inMonth={inMonth}
                            sessions={(sessionsByDay[dateKey] ?? []) as any}
                            totalRooms={totalRooms}
                            roomsById={roomsById}
                            cliniciansById={cliniciansById}
                            onSelect={(key) => router.push(`/planner/${key}?m=${monthParam}`)}
                            isTrainingWeekend={inMonth && trainingKeys.has(toISODate(d))}
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