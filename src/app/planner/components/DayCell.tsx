"use client";

import type { Session } from "../types/planner";

function sumValue(sessions: Session[], code: string): number {
    let total = 0;
    const target = code.toUpperCase();

    for (const s of sessions as any[]) {
        const c = String(s.session_type ?? s.type ?? s.clinic_code ?? "")
            .trim()
            .toUpperCase();

        const raw: unknown = s.value ?? s.session_value ?? s.clinic_value ?? 0;
        const v: number = typeof raw === "number" ? raw : parseFloat(String(raw));

        // ✅ allow ST, ST1, ST-..., "ST ..." etc.
        const matches =
            c === target ||
            c.startsWith(target) ||
            c.includes(` ${target}`) ||
            c.includes(`${target} `);

        if (matches && Number.isFinite(v)) total += v;
    }

    return total;
}

function ymdFromApiDate(input: any) {
    if (!input) return "";
    const s = String(input);
    // ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    // Attempt Date parse fallback
    const d = new Date(s);
    if (!Number.isFinite(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function usedRoomsCount(sessions: Session[]) {
    const set = new Set<number>();
    for (const s of sessions as any[]) {
        const rid = Number(s.room_id ?? s.roomId);
        if (Number.isFinite(rid)) set.add(rid);
    }
    return set.size;
}

export default function DayCell({
                                    date,
                                    inMonth,
                                    sessions,
                                    totalRooms,
                                    roomsById,
                                    cliniciansById,
                                    onSelect,
                                }: {
    date: Date;
    inMonth: boolean;
    sessions: Session[];
    totalRooms: number;
    roomsById: Map<number, string>;
    cliniciansById: Map<number, string>;
    onSelect: (date: Date) => void;
}) {
    // normalize [date] key to local YYYY-MM-DD (matches how you pick dates elsewhere)
    const dayKey = (() => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    })();

    // only count sessions that belong to this [date]
    const daySessions = (sessions as any[]).filter((s) => {
        const apiDate =
            s.session_date ??
            s.date ??
            s.sessionDate ??
            s.clinic_date ??
            s.clinicDate;

        return ymdFromApiDate(String(apiDate)) === dayKey;
    });

    if (inMonth && daySessions.length > 0) {
        console.log("Day:", dayKey, "keys:", Object.keys(daySessions[0] as any));
        console.log("Day sample obj:", daySessions[0]);
    }

    const usedRooms = usedRoomsCount(daySessions);
    const emptyRooms = Math.max(0, (totalRooms ?? 0) - usedRooms);

    const valueST = sumValue(daySessions as any, "ST")

    const valueCL = sumValue(daySessions as any, "CL")

    return (
        <button
            type="button"
            onClick={() => inMonth && onSelect(date)}
            disabled={!inMonth}
            className={`h-[140px] border border-slate-200 p-2 relative text-left w-full ${
                inMonth ? "bg-white hover:bg-slate-50" : "bg-slate-50 opacity-50 cursor-default"
            }`}
        >
            <div className="absolute top-2 left-2 text-xs text-slate-700 font-medium">
                {inMonth ? date.getDate() : ""}
            </div>

            {/* ✅ Only show stats if the day is in the current month */}
            {inMonth && (
                <div className="mt-5 space-y-1 text-[11px] text-slate-600">
                    <div
                        className={`flex justify-between rounded px-1 py-0.5 ${
                            emptyRooms >= 3 ? "bg-red-600 text-white font-medium" : "text-slate-800"
                        }`}
                    >
                        <span>Empty Rooms</span>
                        <span>{emptyRooms}</span>
                    </div>

                    <div
                        className={`flex justify-between rounded px-1 py-0.5 ${
                            valueST > 6
                                ? "text-slate-800"
                                : valueST > 5
                                    ? "bg-orange-100 text-slate-900 font-medium"
                                    : "bg-red-100 text-red-700 font-medium"
                        }`}
                    >
                        <span>Total ST Clinics</span>
                        <span>{valueST.toFixed(2)}</span>
                    </div>

                    <div
                        className={`flex justify-between rounded px-1 py-0.5 ${
                            valueCL > 2
                                ? "text-slate-800"
                                : valueCL >= 1
                                    ? "bg-orange-100 text-slate-900 font-medium"
                                    : "bg-red-100 text-red-700 font-medium"
                        }`}
                    >
                        <span>Total CL Clinics</span>
                        <span>{valueCL.toFixed(2)}</span>
                    </div>
                </div>
            )}
        </button>
    );
}