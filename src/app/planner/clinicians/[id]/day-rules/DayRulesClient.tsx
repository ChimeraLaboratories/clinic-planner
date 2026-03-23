"use client";

import { useEffect, useMemo, useState } from "react";

type Pattern = "W1" | "W2";

type DayRuleRow = {
    id: number | null;
    weekday: number;
    activity_code: string;
    start_time: string | null; // "HH:MM:SS"
    end_time: string | null;
    note: string | null;
    effective_from: string | null;
    effective_to: string | null;
    pattern_code: string; // returned by API (for debug/display)
    room_id: number | null;
    room_allocation_mode: "AUTO" | "FIXED";
};

type ApiResponse = {
    clinician_id: number;
    date: string;
    pattern?: Pattern;
    weekly: DayRuleRow[];
    rooms?: { id: number; name: string }[];
};

type AllocationPreviewStatus =
    | "allocated"
    | "ground-floor"
    | "support-floor"
    | "store-general"
    | "admin"
    | "non-working"
    | "unallocated"
    | "unset";

type AllocationPreviewRow = {
    weekday: number;
    activity_code: string | null;
    status: AllocationPreviewStatus;
    roomId: number | null;
    roomName: string | null;
    label: string;
};

type AllocationPreviewResponse = {
    clinician_id: number;
    date: string;
    pattern: Pattern;
    previews: AllocationPreviewRow[];
};

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const activityOptions = [
    { value: "TESTING", label: "Testing" },
    { value: "D/O", label: "Day Off" },
    { value: "SF", label: "Shop Floor" },
    { value: "CL", label: "CL Testing" },
    { value: "GF_DAY", label: "Ground Floor" },
    { value: "ADMIN", label: "Admin" },
    { value: "SG", label: "SG Testing" },
    { value: "UNSET", label: "— Not Set —" },
];

const activityVisuals: Record<
    string,
    { row: string; badge: string; muted?: boolean }
> = {
    TESTING: {
        row: "bg-green-50 border-l-4 border-green-400 dark:bg-emerald-950/30 dark:border-emerald-500/60",
        badge: "bg-green-100 text-green-800 border border-green-300 font-semibold dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-700/60",
    },
    SF: {
        row: "bg-blue-50 border-l-4 border-blue-400 dark:bg-sky-950/30 dark:border-sky-500/60",
        badge: "bg-blue-100 text-blue-800 border border-blue-300 font-semibold dark:bg-sky-950/50 dark:text-sky-200 dark:border-sky-700/60",
    },
    CL: {
        row: "bg-purple-50 border-l-4 border-purple-400 dark:bg-purple-950/30 dark:border-purple-500/60",
        badge: "bg-purple-100 text-purple-800 border border-purple-300 font-semibold dark:bg-purple-950/50 dark:text-purple-200 dark:border-purple-700/60",
    },
    SG: {
        row: "bg-orange-50 border-l-4 border-orange-400 dark:bg-orange-950/25 dark:border-orange-500/60",
        badge: "bg-orange-100 text-orange-800 border border-orange-300 font-semibold dark:bg-orange-950/45 dark:text-orange-200 dark:border-orange-700/60",
    },
    ADMIN: {
        row: "bg-amber-50 border-l-4 border-amber-400 dark:bg-amber-950/25 dark:border-amber-500/60",
        badge: "bg-amber-100 text-amber-800 border border-amber-300 font-semibold dark:bg-amber-950/45 dark:text-amber-200 dark:border-amber-700/60",
    },
    GF_DAY: {
        row: "bg-slate-50 border-l-4 border-slate-400 dark:bg-slate-900/50 dark:border-slate-500/60",
        badge: "bg-slate-100 text-slate-700 border border-slate-300 font-semibold dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700",
    },
    "D/O": {
        row: "bg-red-50 border-l-4 border-red-400 dark:bg-red-950/25 dark:border-red-500/60",
        badge: "bg-red-100 text-red-800 border border-red-300 font-bold dark:bg-red-950/45 dark:text-red-200 dark:border-red-700/60",
        muted: true,
    },
    UNSET: {
        row: "bg-gray-50 border-l-4 border-gray-300 dark:bg-slate-900/40 dark:border-slate-700",
        badge: "bg-gray-100 text-gray-600 border border-gray-300 font-medium dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        muted: true,
    },
};

const patternOptions: { value: Pattern; label: string; helper: string }[] = [
    { value: "W1", label: "Week A", helper: "Alternate week set 1" },
    { value: "W2", label: "Week B", helper: "Alternate week set 2" },
];

function patternLabel(p: Pattern) {
    return patternOptions.find((x) => x.value === p)?.label ?? p;
}

function activityLabel(code: string | null | undefined) {
    return activityOptions.find((a) => a.value === code)?.label ?? code ?? "—";
}

function isDayOff(code: string | null | undefined) {
    return String(code ?? "").toUpperCase() === "D/O";
}

function toLocalISODate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function normalizePattern(raw: any): Pattern {
    const s = String(raw).trim().toUpperCase();
    if (s === "1" || s === "A" || s === "ODD" || s === "W1" || s === "WEEK1") return "W1";
    if (s === "2" || s === "B" || s === "EVEN" || s === "W2" || s === "WEEK2") return "W2";
    return "W1";
}

function allocationPreviewBadgeClass(status: AllocationPreviewStatus) {
    switch (status) {
        case "allocated":
            return "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-700/60";
        case "ground-floor":
            return "bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700";
        case "support-floor":
            return "bg-blue-100 text-blue-800 border border-blue-300 dark:bg-sky-950/45 dark:text-sky-200 dark:border-sky-700/60";
        case "store-general":
            return "bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-950/45 dark:text-orange-200 dark:border-orange-700/60";
        case "admin":
            return "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/45 dark:text-amber-200 dark:border-amber-700/60";
        case "non-working":
            return "bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/45 dark:text-red-200 dark:border-red-700/60";
        case "unallocated":
            return "bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-200 dark:border-yellow-700/60";
        case "unset":
        default:
            return "bg-gray-100 text-gray-600 border border-gray-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
}

function normalizeAllocationPreviews(input: AllocationPreviewRow[]) {
    return (input ?? []).map((r) => {
        const rawWeekday = Number(r.weekday);

        return {
            weekday: Number.isFinite(rawWeekday) ? rawWeekday : -1,
            activity_code: r.activity_code ?? null,
            status: r.status ?? "unset",
            roomId: r.roomId ?? null,
            roomName: r.roomName ?? null,
            label: r.label ?? "—",
        } satisfies AllocationPreviewRow;
    });
}

function normalizeWeekly(input: DayRuleRow[], selectedPattern: Pattern) {
    const by = new Map<number, DayRuleRow>();
    for (const r of input) by.set(r.weekday, r);

    return Array.from({ length: 7 }, (_, weekday) => {
        const r = by.get(weekday);
        return {
            id: r?.id ?? null,
            weekday,
            activity_code: r?.activity_code ?? "UNSET",
            start_time: r?.start_time ?? null,
            end_time: r?.end_time ?? null,
            note: r?.note ?? null,
            effective_from: r?.effective_from ?? null,
            effective_to: r?.effective_to ?? null,
            pattern_code: String(r?.pattern_code ?? selectedPattern),
            room_id: r?.room_id ?? null,
            room_allocation_mode: r?.room_allocation_mode ?? "AUTO",
        } satisfies DayRuleRow;
    });
}

export default function DayRulesClient({ clinicianId }: { clinicianId: number }) {
    const [viewAsOfDate, setViewAsOfDate] = useState(() => toLocalISODate(new Date()));
    const [effectiveFrom, setEffectiveFrom] = useState(() => toLocalISODate(new Date()));
    const [layout, setLayout] = useState<"table" | "cards">("table");
    const [pattern, setPattern] = useState<Pattern>("W1");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [weekly, setWeekly] = useState<DayRuleRow[]>([]);
    const [rooms, setRooms] = useState<{ id: number; name: string }[]>([]);
    const [allocationPreviews, setAllocationPreviews] = useState<AllocationPreviewRow[]>([]);
    const [originalWeeklyJson, setOriginalWeeklyJson] = useState("");

    const weekdayMap = useMemo(() => {
        const m = new Map<number, DayRuleRow>();
        for (const r of weekly) m.set(r.weekday, r);
        return m;
    }, [weekly]);

    const allocationPreviewMap = useMemo(() => {
        const m = new Map<number, AllocationPreviewRow>();
        for (const r of allocationPreviews) m.set(r.weekday, r);
        return m;
    }, [allocationPreviews]);

    const isDirty = useMemo(() => {
        const now = JSON.stringify(
            weekly.map(({ weekday, activity_code, start_time, end_time, note, room_id, room_allocation_mode }) => ({
                weekday,
                activity_code,
                start_time,
                end_time,
                note,
                room_id,
                room_allocation_mode,
            }))
        );
        return originalWeeklyJson !== "" && now !== originalWeeklyJson;
    }, [weekly, originalWeeklyJson]);

    async function load() {
        setLoading(true);
        setError(null);

        try {
            const [res, previewRes] = await Promise.all([
                fetch(
                    `/planner/api/clinicians/${clinicianId}/day-rules?date=${encodeURIComponent(viewAsOfDate)}&pattern=${encodeURIComponent(
                        pattern
                    )}`,
                    { cache: "no-store" }
                ),
                fetch(
                    `/planner/api/clinicians/${clinicianId}/day-rules/allocations?date=${encodeURIComponent(
                        viewAsOfDate
                    )}&pattern=${encodeURIComponent(pattern)}`,
                    { cache: "no-store" }
                ),
            ]);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = (await res.json()) as ApiResponse;
            const normalized = normalizeWeekly(json.weekly ?? [], pattern);

            setWeekly(normalized);
            setRooms(json.rooms ?? []);

            const currentEffectiveFrom =
                normalized.find((r) => r.effective_from)?.effective_from ?? null;
            if (currentEffectiveFrom) setEffectiveFrom(currentEffectiveFrom);

            const snap = JSON.stringify(
                normalized.map(({ weekday, activity_code, start_time, end_time, note, room_id, room_allocation_mode }) => ({
                    weekday,
                    activity_code,
                    start_time,
                    end_time,
                    note,
                    room_id,
                    room_allocation_mode,
                }))
            );
            setOriginalWeeklyJson(snap);

            if (previewRes.ok) {
                const previewJson = (await previewRes.json()) as AllocationPreviewResponse;
                const normalizePreviews = normalizeAllocationPreviews(previewJson.previews ?? []);
                setAllocationPreviews(normalizePreviews);
            } else {
                setAllocationPreviews([]);
            }
        } catch (e: any) {
            setError(e?.message ?? "Failed to load day rules");
            setWeekly([]);
            setRooms([]);
            setAllocationPreviews([]);
            setOriginalWeeklyJson("");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clinicianId, viewAsOfDate, pattern]);

    function updateWeekday(weekday: number, patch: Partial<DayRuleRow>) {
        setWeekly((prev) =>
            prev.map((r) => {
                if (r.weekday !== weekday) return r;
                const next: DayRuleRow = { ...r, ...patch } as any;

                if (patch.activity_code !== undefined && isDayOff(patch.activity_code)) {
                    next.start_time = null;
                    next.end_time = null;
                }

                return next;
            })
        );
    }

    async function save() {
        setSaving(true);
        setError(null);

        try {
            const payload = {
                mode: "UPDATE_EXISTING",
                effectiveFrom,
                pattern,
                rules: weekly.map((r) => ({
                    id: r.id,
                    weekday: r.weekday,
                    activity_code: r.activity_code,
                    start_time: r.start_time,
                    end_time: r.end_time,
                    note: r.note,
                    room_id: r.room_id,
                    room_allocation_mode: r.room_allocation_mode,
                })),
            };

            const res = await fetch(`/planner/api/clinicians/${clinicianId}/day-rules`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const msg = await res.json().catch(() => null);
                throw new Error(msg?.error ?? `Failed to save (HTTP ${res.status})`);
            }

            await load();
        } catch (e: any) {
            setError(e?.message ?? "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-slate-100">Weekly Day Rules</div>
                    <div className="text-sm text-gray-500 dark:text-slate-400">Sun → Sat</div>
                    <div className="text-sm text-gray-900 dark:text-slate-200">
                        <span className="text-gray-500 dark:text-slate-400">Pattern:</span>{" "}
                        <span className="font-medium">{patternLabel(pattern)}</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                    <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-slate-400">
                        Pattern
                        <select
                            value={pattern}
                            onChange={(e) => setPattern(normalizePattern(e.target.value))}
                            className="rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-slate-100"
                            disabled={saving}
                            title="Choose alternate-week ruleset to view/edit"
                        >
                            {patternOptions.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label} — {p.helper}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-slate-400">
                        View as of
                        <input
                            type="date"
                            value={viewAsOfDate}
                            onChange={(e) => setViewAsOfDate(e.target.value)}
                            className="rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-slate-100"
                            disabled={saving}
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-slate-400">
                        Effective from
                        <input
                            type="date"
                            value={effectiveFrom}
                            onChange={(e) => setEffectiveFrom(e.target.value)}
                            className="rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-slate-100"
                            disabled={saving}
                        />
                    </label>

                    <button
                        onClick={load}
                        className="rounded border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-900 text-gray-900 dark:text-slate-100 disabled:opacity-50"
                        disabled={loading || saving}
                    >
                        {loading ? "Loading…" : "Refresh"}
                    </button>

                    <button
                        onClick={() => setLayout((v) => (v === "table" ? "cards" : "table"))}
                        className="rounded border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-900 text-gray-900 dark:text-slate-100 disabled:opacity-50"
                        disabled={loading || saving}
                        title="Toggle layout"
                    >
                        {layout === "table" ? "Cards view" : "Table view"}
                    </button>

                    <button
                        onClick={save}
                        className="rounded bg-black dark:bg-slate-200 px-4 py-2 text-sm text-white dark:text-slate-900 disabled:opacity-50"
                        disabled={saving || loading || !isDirty}
                        title={!isDirty ? "No changes to save" : "Save changes"}
                    >
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-800 dark:text-red-200">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 text-sm text-gray-600 dark:text-slate-300">
                    Loading day rules…
                </div>
            ) : layout === "table" ? (
                <div className="overflow-x-auto rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-900 text-left text-xs uppercase text-gray-500 dark:text-slate-400">
                        <tr>
                            <th className="px-3 py-2">Day</th>
                            <th className="px-3 py-2">Current activity</th>
                            <th className="px-3 py-2">Change activity</th>
                            <th className="px-3 py-2">Allocation preview</th>
                            <th className="px-3 py-2">Room mode</th>
                            <th className="px-3 py-2">Room</th>
                            <th className="px-3 py-2">Start</th>
                            <th className="px-3 py-2">End</th>
                            <th className="px-3 py-2">Note</th>
                            <th className="px-3 py-2">Current effective</th>
                        </tr>
                        </thead>
                        <tbody>
                        {weekdayNames.map((dayName, weekday) => {
                            const r = weekdayMap.get(weekday);
                            const code = activityOptions.some((a) => a.value === r?.activity_code)
                                ? (r?.activity_code as string)
                                : "UNSET";
                            const visual = activityVisuals[code] ?? activityVisuals.UNSET;
                            const off = isDayOff(r?.activity_code);
                            const allocationPreview = allocationPreviewMap.get(weekday);

                            return (
                                <tr key={weekday} className={`${visual.row} border-t border-gray-200 dark:border-slate-800`}>
                                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-slate-100">{dayName}</td>

                                    <td className="px-3 py-2">
                                        <span className={`inline-flex items-center rounded px-2 py-1 text-xs ${visual.badge}`}>
                                            {activityLabel(r?.activity_code)}
                                        </span>
                                    </td>

                                    <td className="px-3 py-2">
                                        <select
                                            value={r?.activity_code ?? "UNSET"}
                                            onChange={(e) => updateWeekday(weekday, { activity_code: e.target.value })}
                                            className="w-full rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-gray-900 dark:text-slate-100"
                                            disabled={saving || !r}
                                        >
                                            {activityOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    <td className="px-3 py-2">
                                        <span
                                            className={`inline-flex items-center rounded px-2 py-1 text-xs ${allocationPreviewBadgeClass(
                                                allocationPreview?.status ?? "unset"
                                            )}`}
                                            title={allocationPreview?.roomName ?? allocationPreview?.label ?? "—"}
                                        >
                                            {allocationPreview?.label ?? "—"}
                                        </span>
                                    </td>

                                    <td className="px-3 py-2">
                                        <select
                                            value={r?.room_allocation_mode ?? "AUTO"}
                                            onChange={(e) =>
                                                updateWeekday(weekday, {
                                                    room_allocation_mode: e.target.value as "AUTO" | "FIXED",
                                                    room_id: e.target.value === "AUTO" ? null : r?.room_id ?? null,
                                                } as Partial<DayRuleRow>)
                                            }
                                            className="w-full rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-gray-900 dark:text-slate-100"
                                            disabled={saving || !r}
                                        >
                                            <option value="AUTO">Auto</option>
                                            <option value="FIXED">Fixed</option>
                                        </select>
                                    </td>

                                    <td className="px-3 py-2">
                                        <select
                                            value={r?.room_id ?? ""}
                                            onChange={(e) =>
                                                updateWeekday(weekday, {
                                                    room_id: e.target.value ? Number(e.target.value) : null,
                                                } as Partial<DayRuleRow>)
                                            }
                                            className="w-full rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-gray-900 dark:text-slate-100"
                                            disabled={saving || !r || r.room_allocation_mode !== "FIXED"}
                                        >
                                            <option value="">— Select room —</option>
                                            {rooms.map((room) => (
                                                <option key={room.id} value={room.id}>
                                                    {room.name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    <td className="px-3 py-2">
                                        <input
                                            type="time"
                                            value={r?.start_time ? r.start_time.slice(0, 5) : ""}
                                            onChange={(e) =>
                                                updateWeekday(weekday, {
                                                    start_time: e.target.value ? `${e.target.value}:00` : null,
                                                })
                                            }
                                            className="w-full rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-gray-900 dark:text-slate-100"
                                            disabled={saving || !r || off}
                                        />
                                        {off && <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">(times disabled)</div>}
                                    </td>

                                    <td className="px-3 py-2">
                                        <input
                                            type="time"
                                            value={r?.end_time ? r.end_time.slice(0, 5) : ""}
                                            onChange={(e) =>
                                                updateWeekday(weekday, {
                                                    end_time: e.target.value ? `${e.target.value}:00` : null,
                                                })
                                            }
                                            className="w-full rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-gray-900 dark:text-slate-100"
                                            disabled={saving || !r || off}
                                        />
                                    </td>

                                    <td className="px-3 py-2">
                                        <input
                                            value={r?.note ?? ""}
                                            onChange={(e) => updateWeekday(weekday, { note: e.target.value || null })}
                                            className="w-full rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                                            disabled={saving || !r}
                                            placeholder="Optional"
                                        />
                                    </td>

                                    <td className="px-3 py-2 text-xs text-gray-700 dark:text-slate-300">
                                        {r?.effective_from ?? "-"}
                                        {r?.effective_to ? ` → ${r.effective_to}` : ""}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {weekdayNames.map((dayName, weekday) => {
                        const r = weekdayMap.get(weekday);
                        const code = activityOptions.some((a) => a.value === r?.activity_code)
                            ? (r?.activity_code as string)
                            : "UNSET";
                        const visual = activityVisuals[code] ?? activityVisuals.UNSET;
                        const off = isDayOff(r?.activity_code);
                        const allocationPreview = allocationPreviewMap.get(weekday);

                        return (
                            <div key={weekday} className={`rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 ${visual.row}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="font-semibold text-gray-900 dark:text-slate-100">{dayName}</div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`inline-flex items-center rounded px-2 py-1 text-xs ${visual.badge}`}>
                                            {activityLabel(r?.activity_code)}
                                        </span>
                                        <span
                                            className={`inline-flex items-center rounded px-2 py-1 text-xs ${allocationPreviewBadgeClass(
                                                allocationPreview?.status ?? "unset"
                                            )}`}
                                            title={allocationPreview?.roomName ?? allocationPreview?.label ?? "—"}
                                        >
                                            {allocationPreview?.label ?? "—"}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-3 grid gap-2">
                                    <label className="text-xs text-gray-500 dark:text-slate-400">
                                        Activity
                                        <select
                                            value={r?.activity_code ?? "UNSET"}
                                            onChange={(e) => updateWeekday(weekday, { activity_code: e.target.value })}
                                            className="mt-1 w-full rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-gray-900 dark:text-slate-100"
                                            disabled={saving || !r}
                                        >
                                            {activityOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="text-xs text-gray-500 dark:text-slate-400">
                                        Room mode
                                        <select
                                            value={r?.room_allocation_mode ?? "AUTO"}
                                            onChange={(e) =>
                                                updateWeekday(weekday, {
                                                    room_allocation_mode: e.target.value as "AUTO" | "FIXED",
                                                    room_id: e.target.value === "AUTO" ? null : r?.room_id ?? null,
                                                } as Partial<DayRuleRow>)
                                            }
                                            className="mt-1 w-full rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-gray-900 dark:text-slate-100"
                                            disabled={saving || !r}
                                        >
                                            <option value="AUTO">Auto</option>
                                            <option value="FIXED">Fixed</option>
                                        </select>
                                    </label>

                                    <label className="text-xs text-gray-500 dark:text-slate-400">
                                        Room
                                        <select
                                            value={r?.room_id ?? ""}
                                            onChange={(e) =>
                                                updateWeekday(weekday, {
                                                    room_id: e.target.value ? Number(e.target.value) : null,
                                                } as Partial<DayRuleRow>)
                                            }
                                            className="mt-1 w-full rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-gray-900 dark:text-slate-100"
                                            disabled={saving || !r || r.room_allocation_mode !== "FIXED"}
                                        >
                                            <option value="">— Select room —</option>
                                            {rooms.map((room) => (
                                                <option key={room.id} value={room.id}>
                                                    {room.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="text-xs text-gray-500 dark:text-slate-400">
                                        Start
                                        <input
                                            type="time"
                                            value={r?.start_time ? r.start_time.slice(0, 5) : ""}
                                            onChange={(e) =>
                                                updateWeekday(weekday, {
                                                    start_time: e.target.value ? `${e.target.value}:00` : null,
                                                })
                                            }
                                            className="mt-1 w-full rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-gray-900 dark:text-slate-100"
                                            disabled={saving || !r || off}
                                        />
                                    </label>

                                    <label className="text-xs text-gray-500 dark:text-slate-400">
                                        End
                                        <input
                                            type="time"
                                            value={r?.end_time ? r.end_time.slice(0, 5) : ""}
                                            onChange={(e) =>
                                                updateWeekday(weekday, {
                                                    end_time: e.target.value ? `${e.target.value}:00` : null,
                                                })
                                            }
                                            className="mt-1 w-full rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-gray-900 dark:text-slate-100"
                                            disabled={saving || !r || off}
                                        />
                                        {off && <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">(times disabled)</div>}
                                    </label>

                                    <label className="text-xs text-gray-500 dark:text-slate-400">
                                        Note
                                        <input
                                            value={r?.note ?? ""}
                                            onChange={(e) => updateWeekday(weekday, { note: e.target.value || null })}
                                            className="mt-1 w-full rounded border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                                            disabled={saving || !r}
                                            placeholder="Optional"
                                        />
                                    </label>

                                    <div className="text-xs text-gray-600 dark:text-slate-300">
                                        {r?.effective_from ?? "-"}
                                        {r?.effective_to ? ` → ${r?.effective_to}` : ""}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="text-xs text-gray-500 dark:text-slate-400">
                Saving updates the existing weekly ruleset rows for the selected pattern (no duplicate rows created).
                Allocation preview shows the expected room outcome for the selected pattern and “View as of” date.
            </div>
        </div>
    );
}