"use client";

import type { Session } from "../types/planner";

export default function SessionChip({
                                        session,
                                        roomsById,
                                        cliniciansById,
                                    }: {
    session: Session;
    roomsById: Map<number, string>;
    cliniciansById: Map<number, string>;
}) {

    const roomName =
        roomsById.get(Number((session as any).room_id)) ??
        `Room ${String((session as any).room_id ?? "")}`;

    const clinicianName =
        cliniciansById.get(Number((session as any).clinician_id)) ?? "";

    const title = clinicianName || "Clinic";
    const sub = (session as any).type ?? (session as any).session_type ?? "";

    return (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-xs">
            <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                {title}{" "}
                {sub ? (
                    <span className="text-slate-500 dark:text-slate-400">
                        {sub}
                    </span>
                ) : null}
            </div>

            <div className="text-slate-500 dark:text-slate-400 truncate">
                {roomName}
            </div>
        </div>
    );
}