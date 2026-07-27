"use client";

import {
    ArrowDownUp,
    Info,
    Lightbulb,
    RefreshCw,
    ClipboardPlus,
} from "lucide-react";
import {useEffect, useMemo, useState} from "react";
import {Optometrist, Room} from "../types";
import OptometristCard from "./OptometristCard";
import RoomCard from "./RoomCard";

type Assignments = Record<string, Optometrist[]>;

export default function RoomAssignmentPage() {
    const [draggingId, setDraggingId] = useState<string | number | null>(null);
    const [assignments, setAssignments] = useState<Assignments>({});

    const [rooms, setRooms] = useState<Room[]>([]);
    const [optometrists, setOptometrists] = useState<Optometrist[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    async function saveAssignments() {
        setSaving(true);

        const res = await fetch("/planner/api/room-assignment", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ assignments }),
        });

        setSaving(false);

        if (!res.ok) {
            alert("Failed to save room assignments");
            return;
        }

        alert("Room assignments saved");
    }

    useEffect(() => {
        async function loadData() {
            const res = await fetch("/planner/api/room-assignment");

            if (!res.ok) {
                setLoading(false);
                return;
            }

            const data = await res.json();

            setRooms(data.rooms);
            setOptometrists(data.optometrists);
            const savedAssignments: Assignments = {};

            for (const assignment of data.assignments ?? []) {
                const roomId = String(assignment.roomId);

                const optometrist = data.optometrists.find(
                    (item: Optometrist) => item.id === assignment.clinicianId,
                );

                if (!optometrist) continue;

                if (!savedAssignments[roomId]) {
                    savedAssignments[roomId] = [];
                }

                savedAssignments[roomId].push(optometrist);
            }

            setAssignments(savedAssignments);
            setLoading(false);
        }

        loadData();
    }, []);

    const assignedIds = useMemo(() => {
        return new Set(
            Object.values(assignments)
                .flat()
                .map((optom) => optom.id),
        );
    }, [assignments]);

    const unassigned = optometrists.filter((optom) => !assignedIds.has(optom.id));

    function removeFromAllRooms(optometristId: string | number, current: Assignments) {
        const next: Assignments = {};

        for (const [roomId, list] of Object.entries(current)) {
            next[roomId] = list.filter((optom) => optom.id !== optometristId);
        }

        return next;
    }

    function handleDrop(roomId: string | number) {
        if (!draggingId) return;

        const optometrist = optometrists.find((item) => item.id === draggingId);
        if (!optometrist) return;

        setAssignments((current) => {
            const cleared = removeFromAllRooms(draggingId, current);

            return {
                ...cleared,
                [roomId]: [...(cleared[roomId] ?? []), optometrist],
            };
        });

        setDraggingId(null);
    }

    if (loading) {
        return (
            <main className="min-h screen bg-slate-50 p-6">
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    Loading room assignment...
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 p-6">
            <div className="mx-auto max-w-[1800px] space-y-4">
                <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                            Assign Optometrists to Rooms
                        </h1>

                        <p className="mt-3 text-base text-slate-700">
                            Drag and drop optometrists into rooms. The closer to the top, the
                            higher the priority for that room.
                        </p>

                        <div className="mt-5 flex max-w-3xl items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                            <Info className="h-5 w-5 shrink-0" />
                            Optometrists not placed in a room will be assigned to the next
                            free room based on availability.
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={saveAssignments}
                        disabled={saving}
                        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>

                    <div className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:max-w-[500px]">
                        <h2 className="text-sm font-bold text-slate-950">How it works</h2>

                        <div className="mt-4 space-y-4 text-sm text-slate-700">
                            <div className="flex items-center gap-3">
                                <ClipboardPlus className="h-5 w-5 text-blue-600" />
                                Drag an optometrist into a room
                            </div>

                            <div className="flex items-center gap-3">
                                <ArrowDownUp className="h-5 w-5 text-blue-600" />
                                Order within a room by dragging
                            </div>

                            <div className="flex items-center gap-3">
                                <RefreshCw className="h-5 w-5 text-blue-600" />
                                Unassigned will go to the next free room
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-6">
                        {rooms.map((room) => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                optometrists={assignments[room.id] ?? []}
                                onDragStart={setDraggingId}
                                onDropOptometrist={handleDrop}
                            />
                        ))}

                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 xl:col-span-2">
                            <p className="mb-4 text-sm font-bold text-blue-700">
                                Example (Room 2)
                            </p>

                            <div className="space-y-3">
                                {optometrists.slice(1, 4).map((optom, index) => (
                                    <div key={optom.id} className="flex items-center gap-3">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <OptometristCard optometrist={optom} draggable={false} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p className="mt-4 text-sm text-slate-600">
                                Closer to the top = higher priority
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 rounded-xl border border-slate-200 bg-white">
                        <div className="border-b border-slate-100 px-5 py-4">
                            <h2 className="text-sm font-bold text-slate-950">
                                Unassigned Optometrists
                            </h2>
                        </div>

                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                                if (!draggingId) return;
                                setAssignments((current) =>
                                    removeFromAllRooms(draggingId, current),
                                );
                                setDraggingId(null);
                            }}
                            className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-6"
                        >
                            {unassigned.map((optometrist) => (
                                <OptometristCard
                                    key={optometrist.id}
                                    optometrist={optometrist}
                                    onDragStart={() => setDraggingId(optometrist.id)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                        <Lightbulb className="h-5 w-5 shrink-0" />
                        <strong>Tip:</strong>
                        <span>
              Drag optometrists into rooms and arrange them in priority order.
              Any unassigned optometrists will be sent to the next free room
              automatically.
            </span>
                    </div>
                </section>
            </div>
        </main>
    );
}