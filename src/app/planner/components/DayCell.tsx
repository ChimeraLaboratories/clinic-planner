"use client";

import type { Session } from "../types/planner";

function isActiveSession(s: any) {
    return String(s?.status ?? "").toUpperCase() !== "CANCELLED";
}

function getSessionTypeCode(s: any): string {
    return String(s?.session_type ?? s?.type ?? s?.clinic_code ?? s?.clinicCode ?? "")
        .trim()
        .toUpperCase();
}

function getSessionNumericValue(s: any): number {
    const raw =
        s?.value ??
        s?.session_value ??
        s?.clinic_value ??
        s?.st_value ??
        s?.cl_value ??
        0;

    const n = typeof raw === "number" ? raw : parseFloat(String(raw));
    return Number.isFinite(n) ? n : 0;
}

function sumValue(sessions: Session[], code: string): number {
    let total = 0;
    const target = code.toUpperCase();

    for (const s of sessions as any[]) {
        if (!isActiveSession(s)) continue;

        const c = getSessionTypeCode(s);
        const v = getSessionNumericValue(s);

        // ✅ allow ST, ST1, ST-..., "ST ..." etc.
        const matches =
            c === target ||
            c.startsWith(target) ||
            c.includes(` ${target}`) ||
            c.includes(`${target} `);

        if (matches) total += v;
    }

    return total;
}

function usedRoomsCount(sessions: Session[]) {
    const set = new Set<number>();
    for (const s of sessions as any[]) {
        if (!isActiveSession(s)) continue;

        const rid = Number(s.room_id ?? s.roomId ?? s.room?.id);
        if (Number.isFinite(rid)) set.add(rid);
    }
    return set.size;
}

export default function DayCell({
                                    date,
                                    inMonth,
                                    sessions,
                                    dateKey,
                                    totalRooms,
                                    roomsById,
                                    cliniciansById,
                                    onSelect,
                                    isTrainingWeekend,
                                }: {
    date: Date;
    inMonth: boolean;
    sessions: Session[];
    totalRooms: number;
    roomsById: Map<number, string>;
    cliniciansById: Map<number, string>;
    dateKey: string;
    onSelect: (dateKey: string) => void;
    isTrainingWeekend?: boolean;
}) {
    // ✅ IMPORTANT: do NOT re-filter by date here — MonthGrid already passed the correct day's sessions
    const daySessions = (sessions ?? []).filter(isActiveSession) as any[];

    const usedRooms = usedRoomsCount(daySessions as any);
    const emptyRooms = Math.max(0, (totalRooms ?? 0) - usedRooms);

    const valueST = sumValue(daySessions as any, "ST");
    const valueCL = sumValue(daySessions as any, "CL");

    return (
        <button
            type="button"
            onClick={() => inMonth && onSelect(dateKey)}
            disabled={!inMonth}
            className={`h-[140px] border p-2 relative text-left w-full transition ${
                inMonth ? "bg-white hover:bg-slate-50" : "bg-slate-50 opacity-50 cursor-default"
            } ${
                isTrainingWeekend && inMonth
                    ? "border-purple-300 bg-gradient-to-br from-purple-50 to-white ring-2 ring-purple-400"
                    : "border-slate-200"
            }`}
        >
            <div className="absolute top-2 left-2 text-xs text-slate-700 font-medium">
                {inMonth ? date.getDate() : ""}
            </div>

            {inMonth && isTrainingWeekend && (
                <div
                    className="absolute top-2 right-2 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-600 text-white font-semibold shadow-sm tracking-wide"
                    title="Monthly Training Weekend"
                >
                    <span className="w-1.5 h-1.5 bg-white rounded-full opacity-80"></span>
                    TRAINING
                </div>
            )}

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