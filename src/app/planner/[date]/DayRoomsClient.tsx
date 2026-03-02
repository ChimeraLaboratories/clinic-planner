"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { DayRoom } from "@/app/planner/[date]/types";
import CreateSessionModal from "@/app/planner/components/CreateSessionModal";

type Slot = "AM" | "PM" | "FULL";

export default function DayRoomsClient({
                                           initialRooms,
                                           date,
                                           clinicians,
                                       }: {
    initialRooms: DayRoom[];
    date: string; // YYYY-MM-DD (from route param)
    clinicians: {
        id: number;
        full_name?: string | null;
        display_name: string;
        role_code: number;
        grade_code: number;
        is_supervisor: number;
        is_active?: number;
    }[];
}) {
    const [rooms, setRooms] = useState<DayRoom[]>(initialRooms);
    const [deleting, setDeleting] = useState<number | null>(null);
    const router = useRouter();

    const [createOpen, setCreateOpen] = useState(false);
    const [createDefaults, setCreateDefaults] = useState<{
        session_date: string;
        room_id: number;
        slot: Slot;
    } | null>(null);

    useEffect(() => {
        setRooms(initialRooms);
    }, [initialRooms]);

    function openCreateForRoom(roomId: number, slot: Slot = "FULL") {
        setCreateDefaults({
            session_date: date,
            room_id: roomId,
            slot,
        });
        setCreateOpen(true);
    }

    const [addingSupervisor, setAddingSupervisor] = useState(false);
    const [supervisorId, setSupervisorId] = useState<number | "">("");

    const supervisorOptions = clinicians.filter(
        (c) =>
            Number(c.role_code) === 1 &&
            Number(c.grade_code) === 1 &&
            Number(c.is_supervisor) === 1
    );

    async function addSupervisorInStore() {
        if (supervisorId === "") {
            alert("Select a supervisor first.");
            return;
        }

        try {
            setAddingSupervisor(true);

            const res = await fetch("/planner/api/supervisor-in-store", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    in_store_date: date,
                    clinician_id: supervisorId,
                }),
            });

            if (!res.ok) {
                const msg = await res.json().catch(() => null);
                alert(msg?.error ?? "Failed to add supervisor in store.");
                return;
            }

            setSupervisorId("");
            router.refresh();
        } finally {
            setAddingSupervisor(false);
        }
    }

    async function deleteSession(sessionId: number) {
        setDeleting(sessionId);

        const res = await fetch(`/planner/api/sessions/${sessionId}`, {
            method: "DELETE",
        });

        setDeleting(null);

        if (!res.ok) {
            const msg = await res.json().catch(() => null);
            alert(msg?.error ?? "Failed to delete session.");
            return;
        }

        router.refresh();
    }

    async function deleteRoomSessions(sessionIds: number[]) {
        if (sessionIds.length === 0) return;

        setDeleting(sessionIds[0]);

        const results = await Promise.all(
            sessionIds.map((id) =>
                fetch(`/planner/api/sessions/${id}`, { method: "DELETE" }).then((r) => ({
                    id,
                    ok: r.ok,
                }))
            )
        );

        setDeleting(null);

        const failed = results.filter((x) => !x.ok);
        if (failed.length) {
            alert(`Failed to delete ${failed.length} session(s).`);
            return;
        }

        router.refresh();
    }

    return (
        <>

            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="text-sm text-gray-500">Date</div>
                    <div className="text-lg font-semibold text-gray-900">{date}</div>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        className="rounded-lg border px-3 py-2 text-sm bg-white shadow-sm"
                        value={supervisorId}
                        onChange={(e) => setSupervisorId(e.target.value ? Number(e.target.value) : "")}
                    >
                        <option value="">Supervisor in store (not testing)…</option>
                        {supervisorOptions.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.full_name}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={addSupervisorInStore}
                        disabled={addingSupervisor || supervisorId === "" || supervisorOptions.length === 0}
                        className="rounded-lg border px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 disabled:opacity-50"
                        title="Marks the selected supervisor as present in store for this date"
                    >
                        {addingSupervisor ? "Adding…" : "Add"}
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                {rooms.map((room) => {
                    const hasSessions = room.sessions.length > 0;

                    const clinicianNames = Array.from(
                        new Set(
                            room.sessions
                                .map((s: any) => s.clinicianFullName ?? s.clinicianName)
                                .filter(Boolean)
                        )
                    );

                    const needsSupervisorWarning = room.sessions.some((s) =>
                        Boolean((s as any).requiresSupervisorWarning)
                    );

                    return (
                        <div
                            key={room.id}
                            className={`rounded-lg border bg-white shadow-sm ${
                                hasSessions ? "p-5" : "p-4"
                            } ${
                                needsSupervisorWarning
                                    ? "border-red-600 bg-red-50"
                                    : room.used
                                        ? "border-red-300"
                                        : "border-green-300"
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">{room.name}</h3>

                                <div className="flex items-center gap-2">
                                    {!hasSessions ? (
                                        <button
                                            onClick={() => openCreateForRoom(room.id)}
                                            className="text-xs px-2 py-1 rounded border hover:bg-blue-50 text-blue-600 border-blue-200"
                                        >
                                            + Add
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                deleteRoomSessions(room.sessions.map((s) => s.id))
                                            }
                                            disabled={deleting !== null}
                                            className="text-xs px-2 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
                                            title="Delete session(s) in this room"
                                        >
                                            {deleting !== null ? "Deleting…" : "Delete"}
                                        </button>
                                    )}

                                    <span
                                        className={`inline-flex items-center justify-center text-center leading-tight text-xs font-medium px-3 py-1 rounded-full ${
                                            needsSupervisorWarning
                                                ? "bg-red-200 text-red-800"
                                                : room.used
                                                    ? "bg-red-100 text-red-600"
                                                    : "bg-green-100 text-green-600"
                                        }`}
                                    >
                    {needsSupervisorWarning
                        ? "Needs Supervisor"
                        : room.used
                            ? "In Use"
                            : "Free"}
                  </span>
                                </div>
                            </div>

                            {/* Only show a simple summary line under the header */}
                            <div className="mt-3 text-sm text-gray-600">
                                {hasSessions ? (
                                    <div className="space-y-1">
                                        {clinicianNames.length > 0 ? (
                                            clinicianNames.map((name) => (
                                                <div key={name}>• {name}</div>
                                            ))
                                        ) : (
                                            <div className="text-gray-400">• Unassigned</div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-gray-400">No Clinic today</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {createOpen && createDefaults && (
                <CreateSessionModal
                    rooms={rooms.map((r) => ({ id: Number(r.id), name: String(r.name) }))}
                    clinicians={clinicians}
                    defaults={createDefaults}
                    onClose={() => {
                        setCreateOpen(false);
                        setCreateDefaults(null);
                    }}
                    onCreated={() => {
                        setCreateOpen(false);
                        setCreateDefaults(null);
                        router.refresh();
                    }}
                />
            )}
        </>
    );
}