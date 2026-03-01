"use client";

import type { Session } from "../types/planner";

export default function SessionChip({ session }: { session: Session }) {
    const title = session.clinicianName ?? "Clinic";
    const sub = session.type ?? "";

    return (
        <div className="rounded-lg border bg-slate-50 px-2 py-1 text-xs">
            <div className="font-medium text-slate-900 truncate">
                {title} {sub ? <span className="text-slate-500">{sub}</span> : null}
            </div>
            {(session.roomName || session.time) && (
                <div className="text-slate-500 truncate">
                    {session.roomName ?? ""}
                    {session.roomName && session.time ? " · " : ""}
                    {session.time ?? ""}
                </div>
            )}
        </div>
    );
}