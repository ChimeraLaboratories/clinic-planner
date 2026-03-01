"use client";

import type { Session } from "../types/planner";
import {useMemo, useState} from "react";
import CreateSessionModal from "@/app/planner/components/CreateSessionModal";

function formatDate(d: Date) {
    return d.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function toYMD(d: Date) {
    // local YYYY-MM-DD
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export default function DayDrawer({open, date, sessions, roomsById, cliniciansById, onClose, onRefresh,}: {
    open: boolean;
    date: Date | null;
    sessions: Session[];
    roomsById: Map<number, string>;
    cliniciansById: Map<number, string>;
    onClose: () => void;
    onRefresh: () => Promise<void> | void;
}) {
    const [createOpen, setCreateOpen] = useState(false);
    const [createDefaults, setCreateDefaults] = useState<{
        session_date: string;
        room_id: number;
        slot: "AM" | "PM" | "FULL";
    } | null>(null);

    const firstRoomId = useMemo(() => {
        const first = roomsById.keys().next();
        return first.done ? null : first.value;
    }, [roomsById]);

    if (!open || !date) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />

            {/* Drawer */}
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl border-l border-slate-200 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex items-start justify-between gap-4">
                    <div>
                        <div className="text-sm text-slate-500">Day</div>
                        <div className="text-lg font-semibold text-slate-900">
                            {formatDate(date)}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                        Close
                    </button>
                </div>

                {/* Actions */}
                <div className="p-4 border-b border-slate-200 flex gap-2">
                    <button
                        type="button"
                        className="px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                        disabled={!firstRoomId}
                        onClick={() => {
                            if (!firstRoomId) return;

                            setCreateDefaults({
                                session_date: toYMD(date),
                                room_id: firstRoomId,
                                slot: "FULL",
                            });
                            setCreateOpen(true);
                        }}
                    >
                        Add session
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-auto">
                    {sessions.length === 0 ? (
                        <div className="text-slate-600 text-sm">No sessions for this day.</div>
                    ) : (
                        <div className="space-y-2">
                            {sessions.map((s) => {
                                const roomId = Number((s as any).room_id);
                                const clinicianId = Number((s as any).clinician_id);

                                const roomName = roomsById.get(roomId) ?? `Room ${roomId}`;
                                const clinicianName = cliniciansById.get(clinicianId) ?? "";

                                return (
                                    <div
                                        key={String((s as any).id)}
                                        className="rounded-xl border border-slate-200 p-3"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="font-medium text-slate-900">
                                                {clinicianName || "Session"}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {(s as any).status ?? ""}
                                            </div>
                                        </div>

                                        <div className="mt-1 text-sm text-slate-700">
                                            {roomName}
                                            {clinicianName ? ` • ${clinicianName}` : ""}
                                        </div>

                                        <div className="mt-2">
                                            <button
                                                type="button"
                                                className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
                                                onClick={() => alert("Next: Edit session")}
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {createOpen && createDefaults && (
                <CreateSessionModal
                rooms={Array.from(roomsById.entries()).map(([id, name]) => ({id,name}))}
                clinicians={Array.from(cliniciansById.entries()).map(([id,display_name]) => ({
                id,
                display_name,
                }))}
                defaults={createDefaults}
                onClose={() => setCreateOpen(false)}
                onCreated={async () => {
                setCreateOpen(false);
                await onRefresh()
                }}
                />
            )}
        </div>
    );
}