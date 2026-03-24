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

function getInitials(name: string) {
    return String(name ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
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
                                    isToday,
                                    onAddOoHoliday,
                                    missingExpectedCount,
                                    presenceUsers = [],
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
    isToday?: boolean;
    onAddOoHoliday?: (dateKey: string) => void;
    missingExpectedCount?: number;
    presenceUsers?: Array<{
        userId: number;
        name: string;
        viewMode?: "month" | "day" | null;
        isOnline: boolean;
    }>;
}) {
    const daySessions = (sessions ?? []) as any[];

    const usedRooms = usedRoomsCount(daySessions);
    const emptyRooms = Math.max(0, (totalRooms ?? 0) - usedRooms);

    const valueST = sumValue(daySessions as any, "ST");
    const valueCL = sumValue(daySessions as any, "CL");

    const missing = Number(missingExpectedCount ?? 0);
    const visiblePresenceUsers = (presenceUsers ?? []).slice(0, 3);
    const remainingPresenceCount = Math.max(0, (presenceUsers?.length ?? 0) - visiblePresenceUsers.length);

    return (
        <button
            type="button"
            onClick={() => inMonth && onSelect(dateKey)}
            disabled={!inMonth}
            className={`h-[140px] border p-2 text-left w-full transition ${
                inMonth
                    ? "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                    : "bg-slate-50 opacity-50 cursor-default dark:bg-slate-950/60"
            } ${
                isTrainingWeekend && inMonth
                    ? "border-purple-300 bg-gradient-to-br from-purple-50 to-white ring-2 ring-purple-400 dark:border-purple-900/60 dark:from-purple-950/30 dark:to-slate-900 dark:ring-purple-500/30"
                    : isToday && inMonth
                        ? "border-blue-300 ring-2 ring-blue-400 dark:border-blue-900/60 dark:ring-blue-500/30"
                        : "border-slate-200 dark:border-slate-800"
            }`}
        >
            {/* ✅ Header row: date left, badges right (no overlap) */}
            <div className="flex items-start justify-between gap-2">
                <div
                    className={`text-xs font-medium leading-none pt-0.5 ${
                        isToday && inMonth && !isTrainingWeekend
                            ? "text-blue-700 dark:text-blue-200"
                            : "text-slate-700 dark:text-slate-200"
                    }`}
                >
                    {inMonth ? date.getDate() : ""}
                </div>

                <div className="flex flex-col items-end gap-1 max-w-[75%]">
                    {inMonth && (presenceUsers?.length ?? 0) > 0 && (
                        <div className="flex items-center justify-end -space-x-1">
                            {visiblePresenceUsers.map((user) => (
                                <div
                                    key={user.userId}
                                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-[9px] font-semibold text-blue-700 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/35 dark:text-blue-200"
                                    title={user.name}
                                >
                                    {getInitials(user.name)}
                                </div>
                            ))}

                            {remainingPresenceCount > 0 && (
                                <div
                                    className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-slate-300 bg-slate-100 px-1 text-[9px] font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    title={`${remainingPresenceCount} more user${remainingPresenceCount === 1 ? "" : "s"}`}
                                >
                                    +{remainingPresenceCount}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-1">
                        {inMonth && missing > 0 && (
                            <div
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white font-semibold shadow-sm whitespace-nowrap dark:shadow-none"
                                title={`${missing} expected clinician${missing === 1 ? "" : "s"} not assigned`}
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75 dark:bg-red-400/30" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                                </span>
                                MISSING {missing}
                            </div>
                        )}

                        {inMonth && isTrainingWeekend && (
                            <div
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-600 text-white font-semibold shadow-sm tracking-wide whitespace-nowrap dark:shadow-none"
                                title="Monthly Training Weekend"
                            >
                                <span className="w-1.5 h-1.5 bg-white rounded-full opacity-80"></span>
                                TRAINING
                            </div>
                        )}

                        {inMonth && isToday && !isTrainingWeekend && (
                            <div
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-semibold shadow-sm whitespace-nowrap dark:shadow-none"
                                title="Today"
                            >
                                <span className="w-1.5 h-1.5 bg-white rounded-full opacity-80"></span>
                                TODAY
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ✅ Body content sits UNDER header */}
            {inMonth && (
                <div className="mt-2 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                    <div
                        className={`flex justify-between rounded px-1 py-0.5 ${
                            emptyRooms >= 3
                                ? "bg-red-600 text-white font-medium"
                                : "text-slate-800 dark:text-slate-100"
                        }`}
                    >
                        <span>Empty Rooms</span>
                        <span>{emptyRooms}</span>
                    </div>

                    <div
                        className={`flex justify-between rounded px-1 py-0.5 ${
                            valueST > 6
                                ? "text-slate-800 dark:text-slate-100"
                                : valueST > 5
                                    ? "bg-orange-100 text-slate-900 font-medium dark:bg-orange-950/35 dark:text-orange-100"
                                    : "bg-red-100 text-red-700 font-medium dark:bg-red-950/35 dark:text-red-200"
                        }`}
                    >
                        <span>Total ST Clinics</span>
                        <span>{valueST.toFixed(2)}</span>
                    </div>

                    <div
                        className={`flex justify-between rounded px-1 py-0.5 ${
                            valueCL >= 1
                                ? "text-slate-800 dark:text-slate-100"
                                : valueCL > 0 && valueCL < 1
                                    ? "bg-orange-100 text-slate-900 font-medium dark:bg-orange-950/35 dark:text-orange-100"
                                    : "bg-red-100 text-red-700 font-medium dark:bg-red-950/35 dark:text-red-200"
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