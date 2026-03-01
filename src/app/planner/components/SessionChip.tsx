"use client";

import type { Session } from "../types/planner";

export default function SessionChip({session, roomsById, cliniciansById,}: {
    session: Session;
    roomsById: Map<number, string>;
    cliniciansById: Map<number, string>;
}) {

    const roomName = roomsById.get(Number((session as any).room_id)) ?? `Room ${String((session as any).room_id ?? "")}`;

    const clinicianName = cliniciansById.get(Number((session as any).clinician_id)) ?? "";

    const title = clinicianName || "Clinic";
    const sub = (session as any).type ?? (session as any).session_type ?? "";

    return (
        <div className="rounded-lg border bg-slate-50 px-2 py-1 text-xs">
            <div className="font-medium text-slate-900 truncate">
                {title} {sub ? <span className="text-slate-500">{sub}</span> : null}
            </div>
            <div className="text-slate-500 truncate">
                {roomName}
            </div>
        </div>
    );
}