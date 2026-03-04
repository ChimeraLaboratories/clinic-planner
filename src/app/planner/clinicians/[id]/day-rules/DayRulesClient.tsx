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
};

type ApiResponse = {
    clinician_id: number;
    date: string;
    pattern?: Pattern;
    weekly: DayRuleRow[];
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
        row: "bg-green-50 border-l-4 border-green-400",
        badge: "bg-green-100 text-green-800 border border-green-300 font-semibold",
    },
    SF: {
        row: "bg-blue-50 border-l-4 border-blue-400",
        badge: "bg-blue-100 text-blue-800 border border-blue-300 font-semibold",
    },
    CL: {
        row: "bg-purple-50 border-l-4 border-purple-400",
        badge: "bg-purple-100 text-purple-800 border border-purple-300 font-semibold",
    },
    SG: {
        row: "bg-orange-50 border-l-4 border-orange-400",
        badge: "bg-orange-100 text-orange-800 border border-orange-300 font-semibold",
    },
    ADMIN: {
        row: "bg-amber-50 border-l-4 border-amber-400",
        badge: "bg-amber-100 text-amber-800 border border-amber-300 font-semibold",
    },
    GF_DAY: {
        row: "bg-slate-50 border-l-4 border-slate-400",
        badge: "bg-slate-100 text-slate-700 border border-slate-300 font-semibold",
    },
    "D/O": {
        row: "bg-red-50 border-l-4 border-red-400",
        badge: "bg-red-100 text-red-800 border border-red-300 font-bold",
        muted: true,
    },
    UNSET: {
        row: "bg-gray-50 border-l-4 border-gray-300",
        badge: "bg-gray-100 text-gray-600 border border-gray-300 font-medium",
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
    const [originalWeeklyJson, setOriginalWeeklyJson] = useState("");

    const weekdayMap = useMemo(() => {
        const m = new Map<number, DayRuleRow>();
        for (const r of weekly) m.set(r.weekday, r);
        return m;
    }, [weekly]);

    const isDirty = useMemo(() => {
        const now = JSON.stringify(
            weekly.map(({ weekday, activity_code, start_time, end_time, note }) => ({
                weekday,
                activity_code,
                start_time,
                end_time,
                note,
            }))
        );
        return originalWeeklyJson !== "" && now !== originalWeeklyJson;
    }, [weekly, originalWeeklyJson]);

    async function load() {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `/planner/api/clinicians/${clinicianId}/day-rules?date=${encodeURIComponent(viewAsOfDate)}&pattern=${encodeURIComponent(
                    pattern
                )}`,
                { cache: "no-store" }
            );

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = (await res.json()) as ApiResponse;
            const normalized = normalizeWeekly(json.weekly ?? [], pattern);

            setWeekly(normalized);

            // ✅ When editing, default "effective from" to the currently-loaded ruleset effective_from
            const currentEffectiveFrom =
                normalized.find((r) => r.effective_from)?.effective_from ?? null;
            if (currentEffectiveFrom) setEffectiveFrom(currentEffectiveFrom);

            const snap = JSON.stringify(
                normalized.map(({ weekday, activity_code, start_time, end_time, note }) => ({
                    weekday,
                    activity_code,
                    start_time,
                    end_time,
                    note,
                }))
            );
            setOriginalWeeklyJson(snap);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load day rules");
            setWeekly([]);
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

            // Refresh view and reset dirty state
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
                    <div className="text-lg font-semibold">Weekly Day Rules</div>
                    <div className="text-sm text-gray-500">Sun → Sat</div>
                    <div className="text-sm">
                        <span className="text-gray-500">Pattern:</span>{" "}
                        <span className="font-medium">{patternLabel(pattern)}</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                    <label className="flex flex-col gap-1 text-xs text-gray-500">
                        Pattern
                        <select
                            value={pattern}
                            onChange={(e) => setPattern(normalizePattern(e.target.value))}
                            className="rounded border px-3 py-2 text-sm"
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

                    <label className="flex flex-col gap-1 text-xs text-gray-500">
                        View as of
                        <input
                            type="date"
                            value={viewAsOfDate}
                            onChange={(e) => setViewAsOfDate(e.target.value)}
                            className="rounded border px-3 py-2 text-sm"
                            disabled={saving}
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-xs text-gray-500">
                        Effective from
                        <input
                            type="date"
                            value={effectiveFrom}
                            onChange={(e) => setEffectiveFrom(e.target.value)}
                            className="rounded border px-3 py-2 text-sm"
                            disabled={saving}
                        />
                    </label>

                    <button
                        onClick={load}
                        className="rounded border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                        disabled={loading || saving}
                    >
                        {loading ? "Loading…" : "Refresh"}
                    </button>

                    <button
                        onClick={() => setLayout((v) => (v === "table" ? "cards" : "table"))}
                        className="rounded border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                        disabled={loading || saving}
                        title="Toggle layout"
                    >
                        {layout === "table" ? "Cards view" : "Table view"}
                    </button>

                    <button
                        onClick={save}
                        className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                        disabled={saving || loading || !isDirty}
                        title={!isDirty ? "No changes to save" : "Save changes"}
                    >
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {error}
                </div>
            )}

            {/* ✅ Don’t flash UNSET while loading */}
            {loading ? (
                <div className="rounded border bg-white p-4 text-sm text-gray-600">Loading day rules…</div>
            ) : layout === "table" ? (
                <div className="overflow-x-auto rounded border bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-3 py-2">Day</th>
                            <th className="px-3 py-2">Activity</th>
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

                            return (
                                <tr key={weekday} className={`${visual.row} border-t`}>
                                    <td className="px-3 py-2 font-medium">{dayName}</td>

                                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded px-2 py-1 text-xs ${visual.badge}`}>
                        {activityLabel(r?.activity_code)}
                      </span>
                                    </td>

                                    <td className="px-3 py-2">
                                        <select
                                            value={r?.activity_code ?? "UNSET"}
                                            onChange={(e) => updateWeekday(weekday, { activity_code: e.target.value })}
                                            className="w-full rounded border px-2 py-1 text-sm"
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
                                        <input
                                            type="time"
                                            value={r?.start_time ? r.start_time.slice(0, 5) : ""}
                                            onChange={(e) =>
                                                updateWeekday(weekday, {
                                                    start_time: e.target.value ? `${e.target.value}:00` : null,
                                                })
                                            }
                                            className="w-full rounded border px-2 py-1 text-sm"
                                            disabled={saving || !r || off}
                                        />
                                        {off && <div className="mt-1 text-xs text-gray-500">(times disabled)</div>}
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
                                            className="w-full rounded border px-2 py-1 text-sm"
                                            disabled={saving || !r || off}
                                        />
                                    </td>

                                    <td className="px-3 py-2">
                                        <input
                                            value={r?.note ?? ""}
                                            onChange={(e) => updateWeekday(weekday, { note: e.target.value || null })}
                                            className="w-full rounded border px-2 py-1 text-sm"
                                            disabled={saving || !r}
                                            placeholder="Optional"
                                        />
                                    </td>

                                    <td className="px-3 py-2 text-xs text-gray-700">
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
                        const visual = activityVisuals[r?.activity_code ?? "UNSET"] ?? activityVisuals.UNSET;
                        const off = isDayOff(r?.activity_code);

                        return (
                            <div key={weekday} className={`rounded border bg-white p-4 ${visual.row}`}>
                                <div className="flex items-start justify-between">
                                    <div className="font-semibold">{dayName}</div>
                                    <span className={`inline-flex items-center rounded px-2 py-1 text-xs ${visual.badge}`}>
                    {activityLabel(r?.activity_code)}
                  </span>
                                </div>

                                <div className="mt-3 grid gap-2">
                                    <label className="text-xs text-gray-500">
                                        Activity
                                        <select
                                            value={r?.activity_code ?? "UNSET"}
                                            onChange={(e) => updateWeekday(weekday, { activity_code: e.target.value })}
                                            className="mt-1 w-full rounded border px-2 py-1 text-sm"
                                            disabled={saving || !r}
                                        >
                                            {activityOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="text-xs text-gray-500">
                                        Start
                                        <input
                                            type="time"
                                            value={r?.start_time ? r.start_time.slice(0, 5) : ""}
                                            onChange={(e) =>
                                                updateWeekday(weekday, {
                                                    start_time: e.target.value ? `${e.target.value}:00` : null,
                                                })
                                            }
                                            className="mt-1 w-full rounded border px-2 py-1 text-sm"
                                            disabled={saving || !r || off}
                                        />
                                    </label>

                                    <label className="text-xs text-gray-500">
                                        End
                                        <input
                                            type="time"
                                            value={r?.end_time ? r.end_time.slice(0, 5) : ""}
                                            onChange={(e) =>
                                                updateWeekday(weekday, {
                                                    end_time: e.target.value ? `${e.target.value}:00` : null,
                                                })
                                            }
                                            className="mt-1 w-full rounded border px-2 py-1 text-sm"
                                            disabled={saving || !r || off}
                                        />
                                        {off && <div className="mt-1 text-xs text-gray-500">(times disabled)</div>}
                                    </label>

                                    <label className="text-xs text-gray-500">
                                        Note
                                        <input
                                            value={r?.note ?? ""}
                                            onChange={(e) => updateWeekday(weekday, { note: e.target.value || null })}
                                            className="mt-1 w-full rounded border px-2 py-1 text-sm"
                                            disabled={saving || !r}
                                            placeholder="Optional"
                                        />
                                    </label>

                                    <div className="text-xs text-gray-600">
                                        {r?.effective_from ?? "-"}
                                        {r?.effective_to ? ` → ${r?.effective_to}` : ""}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="text-xs text-gray-500">
                Saving updates the existing weekly ruleset rows for the selected pattern (no duplicate rows created).
            </div>
        </div>
    );
}