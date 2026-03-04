"use client";

import type { Session } from "../types/planner";

function sumValue(sessions: any[], code: "ST" | "CL") {
    let total = 0;

    for (const s of sessions) {
        const c = String(s.session_type ?? s.type ?? s.clinic_code ?? "")
            .trim()
            .toUpperCase();

        if (!c.startsWith(code)) continue;

        const v = Number(s.value ?? 0); // uses API-computed value
        if (Number.isFinite(v)) total += v;
    }

    return total;
}

function usedRoomsCount(sessions: Session[]) {
    const set = new Set<number>();

    for (const s of sessions as any[]) {
        const rid = Number(s.room_id ?? s.roomId);
        if (Number.isFinite(rid) && rid > 0) set.add(rid);
    }

    return set.size;
}

export default function DayCell({
                                    date,
                                    inMonth,
                                    sessions,
                                    dateKey,
                                    totalRooms,
                                    roomsById, // kept (unused currently)
                                    cliniciansById, // kept (unused currently)
                                    onSelect,
                                    isTrainingWeekend,
                                    onAddOoHoliday,
                                    missingExpectedCount,
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
    onAddOoHoliday?: (dateKey: string) => void;
    missingExpectedCount?: number;
}) {
    const daySessions = (sessions ?? []) as any[];

    const usedRooms = usedRoomsCount(daySessions);
    const emptyRooms = Math.max(0, (totalRooms ?? 0) - usedRooms);

    const valueST = sumValue(daySessions as any, "ST");
    const valueCL = sumValue(daySessions as any, "CL");

    const missing = Number(missingExpectedCount ?? 0);

    return (
        <button
            type="button"
            onClick={() => inMonth && onSelect(dateKey)}
            disabled={!inMonth}
            className={`h-[140px] border p-2 text-left w-full transition ${
                inMonth ? "bg-white hover:bg-slate-50" : "bg-slate-50 opacity-50 cursor-default"
            } ${
                isTrainingWeekend && inMonth
                    ? "border-purple-300 bg-gradient-to-br from-purple-50 to-white ring-2 ring-purple-400"
                    : "border-slate-200"
            }`}
        >
            {/* ✅ Header row: date left, badges right (no overlap) */}
            <div className="flex items-start justify-between gap-2">
                <div className="text-xs text-slate-700 font-medium leading-none pt-0.5">
                    {inMonth ? date.getDate() : ""}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1 max-w-[75%]">
                    {inMonth && missing > 0 && (
                        <div
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white font-semibold shadow-sm whitespace-nowrap"
                            title={`${missing} expected clinician${missing === 1 ? "" : "s"} not assigned`}
                        >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
                            MISSING {missing}
                        </div>
                    )}

                    {inMonth && isTrainingWeekend && (
                        <div
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-600 text-white font-semibold shadow-sm tracking-wide whitespace-nowrap"
                            title="Monthly Training Weekend"
                        >
                            <span className="w-1.5 h-1.5 bg-white rounded-full opacity-80"></span>
                            TRAINING
                        </div>
                    )}
                </div>
            </div>

            {/* ✅ Body content sits UNDER header */}
            {inMonth && (
                <div className="mt-2 space-y-1 text-[11px] text-slate-600">
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
                            valueCL >= 1
                                ? "text-slate-800"
                                : valueCL > 0 && valueCL < 1
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