"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { DayRoom } from "@/app/planner/[date]/types";
import CreateSessionModal from "@/app/planner/components/CreateSessionModal";
import { usePresence, type PresenceUser } from "@/app/planner/hooks/usePresence";

type Slot = "AM" | "PM" | "FULL";

// ✅ Safer: extracts YYYY-MM-DD from ANY string without timezone shifting
function extractYmd(input: any): string | null {
    if (!input) return null;

    if (typeof input === "string") {
        const m = input.match(/(\d{4}-\d{2}-\d{2})/);
        return m ? m[1] : null;
    }

    if (input instanceof Date && !isNaN(input.getTime())) {
        const yyyy = input.getFullYear();
        const mm = String(input.getMonth() + 1).padStart(2, "0");
        const dd = String(input.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    return null;
}

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

function ymdLocal(d: Date) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// ✅ computes a from/to range covering the month of the given YYYY-MM-DD
function monthRangeFromYmd(dateYmd: string): { from: string; to: string } {
    const yyyy = Number(dateYmd.slice(0, 4));
    const mm = Number(dateYmd.slice(5, 7)); // 1..12

    const from = `${yyyy}-${pad2(mm)}-01`;

    // last day of month: day 0 of next month
    const last = new Date(yyyy, mm, 0);
    const to = ymdLocal(last);

    return { from, to };
}

function getInitials(name: string | null | undefined) {
    return String(name ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

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

    const editingRoomId = createOpen ? createDefaults?.room_id ?? null : null;
    const { users: presenceUsers } = usePresence({
        activity: editingRoomId ? "editing" : "viewing",
        activeRoomId: editingRoomId,
    });

    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch("/planner/api/me", { cache: "no-store" });
                if (!res.ok) return;
                const json = await res.json();
                const id = Number(json?.user?.id ?? null);
                if (!cancelled && Number.isFinite(id) && id > 0) {
                    setCurrentUserId(id);
                }
            } catch {
                // ignore
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

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

    // ✅ store supervisor-in-store selection for this date (API returns string)
    const [supervisorInStoreForDay, setSupervisorInStoreForDay] = useState<string>("");
    const [loadingSupervisorInStore, setLoadingSupervisorInStore] = useState(false);

    async function fetchSupervisorInStoreForDay() {
        try {
            setLoadingSupervisorInStore(true);

            const { from, to } = monthRangeFromYmd(date);

            // ✅ your API needs from/to
            const res = await fetch(
                `/planner/api/planner?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
                { cache: "no-store" }
            );

            if (!res.ok) {
                console.warn("[DayRoomsClient] planner fetch failed", res.status);
                setSupervisorInStoreForDay("");
                return;
            }

            const data = await res.json().catch(() => null);
            const rows = Array.isArray(data?.supervisionByDate) ? data.supervisionByDate : [];

            const row = rows.find((r: any) => {
                const ymdA = extractYmd(r?.date);
                const ymdB = extractYmd(r?.in_store_date);
                const ymdC = extractYmd(r?.inStoreDate);
                return ymdA === date || ymdB === date || ymdC === date;
            });

            // ✅ API returns supervisorsInStore as string e.g. "Chintu"
            const sis = String(row?.supervisorsInStore ?? "").trim();
            setSupervisorInStoreForDay(sis);
        } finally {
            setLoadingSupervisorInStore(false);
        }
    }

    // ✅ load on mount + whenever date changes
    useEffect(() => {
        fetchSupervisorInStoreForDay();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date]);

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

            // ✅ refresh local banner immediately (and keep your router.refresh)
            await fetchSupervisorInStoreForDay();
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

    const supervisorInStoreLabel = useMemo(() => {
        return String(supervisorInStoreForDay ?? "").trim();
    }, [supervisorInStoreForDay]);

    const otherEditorsByRoom = useMemo(() => {
        const map = new Map<number, PresenceUser[]>();

        for (const user of presenceUsers) {
            if (!user?.isOnline) continue;
            if (user?.dateYmd !== date) continue;
            if (user?.activity !== "editing") continue;

            const roomId = Number(user?.activeRoomId);
            if (!Number.isFinite(roomId) || roomId <= 0) continue;

            if (currentUserId != null && Number(user.userId) === currentUserId) continue;

            const list = map.get(roomId) ?? [];
            list.push(user);
            map.set(roomId, list);
        }

        return map;
    }, [presenceUsers, date, currentUserId]);

    return (
        <>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="text-sm text-gray-500 dark:text-slate-400">Date</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-slate-100">{date}</div>

                    {/* banner showing selected supervisor in store */}
                    {loadingSupervisorInStore ? (
                        <div className="mt-2 text-sm text-gray-400 dark:text-slate-500">
                            Loading supervisor in store…
                        </div>
                    ) : supervisorInStoreLabel ? (
                        <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100 dark:shadow-none">
                            <span className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                                Supervisor in store
                            </span>
                            <span className="font-medium">{supervisorInStoreLabel}</span>
                        </div>
                    ) : null}
                </div>

                <div className="flex items-center gap-2">
                    <select
                        className="rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-sm dark:shadow-none"
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
                        className="rounded-lg border border-gray-200 dark:border-slate-800 px-4 py-2 text-sm font-medium shadow-sm dark:shadow-none text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-900 disabled:opacity-50"
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

                    const otherEditors = otherEditorsByRoom.get(Number(room.id)) ?? [];
                    const isLockedByOtherUser = otherEditors.length > 0;

                    return (
                        <div
                            key={room.id}
                            className={`rounded-lg border shadow-sm dark:shadow-none ${
                                hasSessions ? "p-5" : "p-4"
                            } ${
                                isLockedByOtherUser
                                    ? "border-amber-400 bg-amber-50 dark:border-amber-900/70 dark:bg-amber-950/25"
                                    : needsSupervisorWarning
                                        ? "border-red-600 bg-red-50 dark:border-red-900/70 dark:bg-red-950/30"
                                        : room.used
                                            ? "border-red-300 bg-white dark:border-red-900/50 dark:bg-slate-900"
                                            : "border-green-300 bg-white dark:border-emerald-900/50 dark:bg-slate-900"
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 dark:text-slate-100">{room.name}</h3>

                                <div className="flex items-center gap-2">
                                    {!hasSessions ? (
                                        <button
                                            onClick={() => {
                                                if (isLockedByOtherUser) {
                                                    alert("This room is currently being edited by another user.");
                                                    return;
                                                }
                                                openCreateForRoom(room.id);
                                            }}
                                            disabled={isLockedByOtherUser}
                                            className="text-xs px-2 py-1 rounded border border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-300 disabled:opacity-50"
                                        >
                                            + Add
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if (isLockedByOtherUser) {
                                                    alert("This room is currently being edited by another user.");
                                                    return;
                                                }
                                                deleteRoomSessions(room.sessions.map((s) => s.id));
                                            }}
                                            disabled={deleting !== null || isLockedByOtherUser}
                                            className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 text-gray-900 dark:text-slate-100"
                                            title="Delete session(s) in this room"
                                        >
                                            {deleting !== null ? "Deleting…" : "Delete"}
                                        </button>
                                    )}

                                    <span
                                        className={`inline-flex items-center justify-center text-center leading-tight text-xs font-medium px-3 py-1 rounded-full ${
                                            isLockedByOtherUser
                                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                                                : needsSupervisorWarning
                                                    ? "bg-red-200 text-red-800 dark:bg-red-950/50 dark:text-red-200"
                                                    : room.used
                                                        ? "bg-red-100 text-red-600 dark:bg-red-950/35 dark:text-red-200"
                                                        : "bg-green-100 text-green-600 dark:bg-emerald-950/35 dark:text-emerald-200"
                                        }`}
                                    >
                                        {isLockedByOtherUser
                                            ? "Being Edited"
                                            : needsSupervisorWarning
                                                ? "Needs Supervisor"
                                                : room.used
                                                    ? "In Use"
                                                    : "Free"}
                                    </span>
                                </div>
                            </div>

                            {otherEditors.length > 0 && (
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {otherEditors.map((user) => (
                                        <div
                                            key={user.userId}
                                            className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-2 py-1 text-xs text-amber-800 shadow-sm dark:border-amber-900/60 dark:bg-slate-900 dark:text-amber-200 dark:shadow-none"
                                            title={`${user.name} is editing this room`}
                                        >
                                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-semibold text-white ring-2 ring-amber-300 dark:ring-amber-800">
                                                {getInitials(user.name)}
                                            </span>
                                            <span>{user.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-3 text-sm text-gray-600 dark:text-slate-300">
                                {hasSessions ? (
                                    <div className="space-y-1">
                                        {clinicianNames.length > 0 ? (
                                            clinicianNames.map((name) => <div key={name}>• {name}</div>)
                                        ) : (
                                            <div className="text-gray-400 dark:text-slate-500">• Unassigned</div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-gray-400 dark:text-slate-500">No Clinic today</div>
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