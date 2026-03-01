"use client";

import type { Session } from "../types/planner";

function formatDate(d: Date) {
    return d.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export default function DayDrawer({
                                      open,
                                      date,
                                      sessions,
                                      onClose,
                                  }: {
    open: boolean;
    date: Date | null;
    sessions: Session[];
    onClose: () => void;
}) {
    if (!open || !date) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />

            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl border-l border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200 flex items-start justify-between gap-4">
                    <div>
                        <div className="text-sm text-slate-500">Day</div>
                        <div className="text-lg font-semibold text-slate-900">{formatDate(date)}</div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                        Close
                    </button>
                </div>

                <div className="p-4 border-b border-slate-200 flex gap-2">
                    <button
                        type="button"
                        className="px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                        onClick={() => alert("Next: Add session form")}
                    >
                        Add session
                    </button>
                </div>

                <div className="p-4 overflow-auto">
                    {sessions.length === 0 ? (
                        <div className="text-slate-600 text-sm">No sessions for this day.</div>
                    ) : (
                        <div className="space-y-2">
                            {sessions.map((s) => (
                                <div key={String(s.id)} className="rounded-xl border border-slate-200 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="font-medium text-slate-900">Session</div>
                                        <div className="text-xs text-slate-500">{s.status ?? ""}</div>
                                    </div>

                                    <div className="mt-1 text-sm text-slate-700">
                                        Room: {s.room_id ?? "—"} • Clinician: {s.clinician_id ?? "—"}
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
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}