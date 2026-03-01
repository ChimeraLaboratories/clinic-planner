"use client";

import type { Session } from "../types/planner";
import SessionChip from "./SessionChip";

function sumValue(sessions: Session[], code: string) {
    let total = 0;
    for (const s of sessions as any[]) {
        const c = (s.clinic_code ?? s.clinicType ?? s.type ?? "").toString().toUpperCase();
        const v = Number(s.value ?? s.clinical_value ?? 0);
        if (c === code) total += Number.isFinite(v) ? v : 0;
    }
    return total;
}

function ymdFromApiDate(input: string) {
    return (input ?? "").slice(0, 10);
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
    // ✅ normalize day key to local YYYY-MM-DD (matches how you pick dates elsewhere)
    const dayKey = (() => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    })();

    // ✅ FIX: only count sessions that belong to this day
    const daySessions = (sessions as any[]).filter((s) => {
        const apiDate = s.session_date ?? s.date ?? "";
        return ymdFromApiDate(String(apiDate)) === dayKey;
    });

    const clinics = daySessions.length;

    const usedRooms = usedRoomsCount(daySessions);
    const emptyRooms = Math.max(0, (totalRooms ?? 0) - usedRooms);

    const valueST = sumValue(daySessions, "ST");
    const valueCL = sumValue(daySessions, "CL");

    return (
        <button
            type="button"
            onClick={() => onSelect(date)}
            className={`h-[140px] border border-slate-200 p-2 relative text-left w-full ${
                inMonth ? "bg-white hover:bg-slate-50" : "bg-slate-50"
            }`}
        >
            <div className="absolute top-2 left-2 text-xs text-slate-700 font-medium">
                {inMonth ? date.getDate() : ""}
            </div>

            <div className="mt-6 space-y-1 text-[11px] text-slate-600">
                <div className="flex justify-between">
                    <span>Clinics</span>
                    <span className="text-slate-800">{clinics}</span>
                </div>
                <div className="flex justify-between">
                    <span>Empty Rooms</span>
                    <span className="text-slate-800">{emptyRooms}</span>
                </div>
                <div className="flex justify-between">
                    <span>Total ST Clinics</span>
                    <span className="text-slate-800">{valueST}</span>
                </div>
                <div className="flex justify-between">
                    <span>Total CL Clinics</span>
                    <span className="text-slate-800">{valueCL}</span>
                </div>
            </div>

            <div className="space-y-1">
                {daySessions.length > 3 && (
                    <div className="text-xs text-slate-500">+{daySessions.length - 3} more</div>
                )}
            </div>
        </button>
    );
}