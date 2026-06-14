"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { DayRoom } from "@/app/planner/[date]/types";
import CreateSessionModal from "@/app/planner/modals/components/CreateSessionModal";
import { usePresence, type PresenceUser } from "@/app/planner/hooks/usePresence";
import { useDayNavigation } from "@/app/planner/context/DayNavigationContext";

type Slot = "AM" | "PM" | "FULL";

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

function monthRangeFromYmd(dateYmd: string): { from: string; to: string } {
    const yyyy = Number(dateYmd.slice(0, 4));
    const mm = Number(dateYmd.slice(5, 7));

    const from = `${yyyy}-${pad2(mm)}-01`;
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
    date: string;
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
    const router = useRouter();

    const {
        setSelectedDate,
        setShowDaySwitcher,
        setOnPrevDay,
        setOnNextDay,
        setOnToday,
    } = useDayNavigation();

    const [rooms, setRooms] = useState<DayRoom[]>(initialRooms);
    const [deleting, setDeleting] = useState<number | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [createDefaults, setCreateDefaults] = useState<{
        session_date: string;
        room_id: number;
        slot: Slot;
    } | null>(null);

    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const [addingSupervisor, setAddingSupervisor] = useState(false);
    const [supervisorId, setSupervisorId] = useState<number | "">("");

    const [supervisorInStoreForDay, setSupervisorInStoreForDay] = useState<string>("");
    const [loadingSupervisorInStore, setLoadingSupervisorInStore] = useState(false);

    const editingRoomId = createOpen ? createDefaults?.room_id ?? null : null;

    const { users: presenceUsers } = usePresence({
        activity: editingRoomId ? "editing" : "viewing",
        activeRoomId: editingRoomId,
    });

    function navigateDay(offset: number) {
        const current = new Date(`${date}T12:00:00`);

        current.setDate(current.getDate() + offset);

        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, "0");
        const dd = String(current.getDate()).padStart(2, "0");

        router.push(`/planner/${yyyy}-${mm}-${dd}`);
    }

    function goToToday() {
        const today = new Date();

        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");

        router.push(`/planner/${yyyy}-${mm}-${dd}`);
    }

    useEffect(() => {
        const selectedDate = new Date(`${date}T12:00:00`);

        setShowDaySwitcher(true);
        setSelectedDate(selectedDate);

        setOnPrevDay(() => () => navigateDay(-1));
        setOnNextDay(() => () => navigateDay(1));
        setOnToday(() => goToToday);

        return () => {
            setShowDaySwitcher(false);
            setSelectedDate(null);
            setOnPrevDay(null);
            setOnNextDay(null);
            setOnToday(null);
        };
    }, [
        date,
        setSelectedDate,
        setShowDaySwitcher,
        setOnPrevDay,
        setOnNextDay,
        setOnToday,
    ]);

    useEffect(() => {
        let cancelled = false;

        async function loadCurrentUser() {
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
        }

        loadCurrentUser();

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

    const supervisorOptions = clinicians.filter(
        (c) =>
            Number(c.role_code) === 1 &&
            Number(c.grade_code) === 1 &&
            Number(c.is_supervisor) === 1
    );

    async function fetchSupervisorInStoreForDay() {
        try {
            setLoadingSupervisorInStore(true);

            const { from, to } = monthRangeFromYmd(date);

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
            const rows = Array.isArray(data?.supervisionByDate)
                ? data.supervisionByDate
                : [];

            const row = rows.find((r: any) => {
                const ymdA = extractYmd(r?.date);
                const ymdB = extractYmd(r?.in_store_date);
                const ymdC = extractYmd(r?.inStoreDate);

                return ymdA === date || ymdB === date || ymdC === date;
            });

            const sis = String(row?.supervisorsInStore ?? "").trim();
            setSupervisorInStoreForDay(sis);
        } finally {
            setLoadingSupervisorInStore(false);
        }
    }

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

            await fetchSupervisorInStoreForDay();
            router.refresh();
        } finally {
            setAddingSupervisor(false);
        }
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
            {(loadingSupervisorInStore || supervisorInStoreLabel) && (
                <div className="mb-4">
                    {loadingSupervisorInStore ? (
                        <div className="text-sm text-gray-400 dark:text-slate-500">
                            Loading supervisor in store…
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100 dark:shadow-none">
                            <span className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                                Supervisor in store
                            </span>
                            <span className="font-medium">{supervisorInStoreLabel}</span>
                        </div>
                    )}
                </div>
            )}

            <div className="mb-4 flex justify-end">
                <div className="flex items-center gap-2">
                    <select
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none"
                        value={supervisorId}
                        onChange={(e) =>
                            setSupervisorId(e.target.value ? Number(e.target.value) : "")
                        }
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
                        disabled={
                            addingSupervisor ||
                            supervisorId === "" ||
                            supervisorOptions.length === 0
                        }
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-100 dark:shadow-none dark:hover:bg-slate-900"
                        title="Marks the selected supervisor as present in store for this date"
                    >
                        {addingSupervisor ? "Adding…" : "Add"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                            <div className="flex items-center justify-between whitespace-nowrap">
                                <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                                    {room.name}
                                </h3>

                                <div className="flex items-center gap-2">
                                    {!hasSessions ? (
                                        <button
                                            onClick={() => {
                                                if (isLockedByOtherUser) {
                                                    alert(
                                                        "This room is currently being edited by another user."
                                                    );
                                                    return;
                                                }

                                                openCreateForRoom(room.id);
                                            }}
                                            disabled={isLockedByOtherUser}
                                            className="rounded border border-blue-200 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:border-blue-900/60 dark:text-blue-300 dark:hover:bg-blue-950/30"
                                        >
                                            + Add
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if (isLockedByOtherUser) {
                                                    alert(
                                                        "This room is currently being edited by another user."
                                                    );
                                                    return;
                                                }

                                                deleteRoomSessions(room.sessions.map((s) => s.id));
                                            }}
                                            disabled={deleting !== null || isLockedByOtherUser}
                                            className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-900 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800"
                                            title="Delete session(s) in this room"
                                        >
                                            {deleting !== null ? "Deleting…" : "Delete"}
                                        </button>
                                    )}

                                    <span
                                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-center text-xs font-medium leading-tight ${
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
                                            clinicianNames.map((name) => (
                                                <div key={name}>• {name}</div>
                                            ))
                                        ) : (
                                            <div className="text-gray-400 dark:text-slate-500">
                                                • Unassigned
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-gray-400 dark:text-slate-500">
                                        No Clinic today
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {createOpen && createDefaults && (
                <CreateSessionModal
                    rooms={rooms.map((r) => ({
                        id: Number(r.id),
                        name: String(r.name),
                    }))}
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