"use client";

import { useEffect, useMemo, useState } from "react";
import {useRouter} from "next/navigation";

type DayRuleRow = {
    id: number | null;
    weekday: number;
    activity_code: string;
    start_time: string | null; // "HH:MM:SS"
    end_time: string | null;
    note: string | null;
    effective_from: string | null;
    effective_to: string | null;
    pattern_code: string;
};

type ApiResponse = {
    clinician_id: number;
    date: string;
    weekly: DayRuleRow[];
};

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const activityOptions = [
    { value: "TESTING", label: "Testing" },
    { value: "D/O", label: "Day Off" },
    { value: "SF", label: "Shop Floor" },
    { value: "CL", label: "CL Testing" },
    { value: "GF_DAY", label: "Ground Floor"},
    { value: "ADMIN", label: "Admin"},
    { value: "SG", label: "SG Testing"},
    { value: "UNSET", label: "— Not Set —"}
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

function activityLabel(code: string | null | undefined) {
    return activityOptions.find((a) => a.value === code)?.label ?? code ?? "—";
}

function isDayOff(code: string | null | undefined) {
    return String(code ?? "").toUpperCase() === "D/O";
}

function toLocalISODate(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function normalizeWeekly(input: DayRuleRow[]) {
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
            pattern_code: r?.pattern_code ?? "EVERY",
        } satisfies DayRuleRow;
    });
}

export default function DayRulesClient({ clinicianId }: { clinicianId: number }) {
    const [viewAsOfDate, setViewAsOfDate] = useState<string>(() => toLocalISODate(new Date()));
    const [effectiveFrom, setEffectiveFrom] = useState<string>(() => toLocalISODate(new Date()));
    const [layout, setLayout] = useState<"table" | "cards">("table");
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [weekly, setWeekly] = useState<DayRuleRow[]>([]);
    const [originalWeeklyJson, setOriginalWeeklyJson] = useState<string>("");

    const weekdayMap = useMemo(() => {
        const m = new Map<number, DayRuleRow>();
        for (const r of weekly) m.set(r.weekday, r);
        return m;
    }, [weekly]);

    const isDirty = useMemo(() => {
        const now = JSON.stringify(weekly.map(({ weekday, activity_code, start_time, end_time, note }) => ({
            weekday, activity_code, start_time, end_time, note
        })));
        return originalWeeklyJson !== "" && now !== originalWeeklyJson;
    }, [weekly, originalWeeklyJson]);

    async function load() {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `/planner/api/clinicians/${clinicianId}/day-rules?date=${encodeURIComponent(viewAsOfDate)}`,
                { cache: "no-store" }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = (await res.json()) as ApiResponse;
            const normalized = normalizeWeekly(json.weekly ?? []);
            setWeekly(normalized);

            const snap = JSON.stringify(normalized.map(({ weekday, activity_code, start_time, end_time, note }) => ({
                weekday, activity_code, start_time, end_time, note
            })));
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
    }, [clinicianId, viewAsOfDate]);

    function updateWeekday(weekday: number, patch: Partial<DayRuleRow>) {
        setWeekly((prev) =>
            prev.map((r) => {
                if (r.weekday !== weekday) return r;

                const next = { ...r, ...patch };

                // ✅ Auto behaviour when switching to Day Off
                if (patch.activity_code !== undefined && isDayOff(patch.activity_code)) {
                    next.start_time = null;
                    next.end_time = null;

                    // Optional: keep notes, or clear them. Uncomment if you want to clear notes too:
                    // next.note = null;
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
                effectiveFrom,
                rules: weekly.map((r) => ({
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

            // After save, re-load using the effectiveFrom date so you see what you just created
            setViewAsOfDate(effectiveFrom);
            // load will run from effect; but also safe to call immediately:
            // await load();
        } catch (e: any) {
            setError(e?.message ?? "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg border bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <div className="text-sm text-gray-500">Weekly Day Rules</div>
                        <div className="text-lg font-semibold">Sun → Sat</div>
                    </div>


                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">View as of</label>
                            <input
                                type="date"
                                value={viewAsOfDate}
                                onChange={(e) => setViewAsOfDate(e.target.value)}
                                className="rounded border px-3 py-2 text-sm"
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Save effective from</label>
                            <input
                                type="date"
                                value={effectiveFrom}
                                onChange={(e) => setEffectiveFrom(e.target.value)}
                                className="rounded border px-3 py-2 text-sm"
                                disabled={saving}
                            />
                        </div>

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
                            className="rounded border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                            disabled={loading || saving || !isDirty}
                            title={!isDirty ? "No changes to save" : "Save new effective rules"}
                        >
                            {saving ? "Saving…" : "Save"}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="mt-4">
                    {layout === "table" ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="text-left p-3">Day</th>
                                    <th className="text-left p-3">Activity</th>
                                    <th className="text-left p-3">Start</th>
                                    <th className="text-left p-3">End</th>
                                    <th className="text-left p-3">Note</th>
                                    <th className="text-left p-3">Current effective</th>
                                </tr>
                                </thead>

                                <tbody>
                                {weekdayNames.map((dayName, weekday) => {
                                    const r = weekdayMap.get(weekday);
                                    const code = activityOptions.some(a => a.value === r?.activity_code)
                                        ? (r?.activity_code as string)
                                        : "UNSET";
                                    const visual = activityVisuals[code];
                                    const off = isDayOff(r?.activity_code);

                                    return (
                                        <tr
                                            key={weekday}
                                            className={[
                                                "border-t transition-all duration-150",
                                                "hover:-translate-y-[1px] hover:shadow-sm hover:bg-white",
                                                visual?.row ?? "",
                                                visual?.muted ? "opacity-80" : "",
                                            ].join(" ")}
                                        >
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                    <span className={["text-sm", off ? "font-bold" : "font-semibold"].join(" ")}>
                      {dayName}
                    </span>

                                                    <span
                                                        className={[
                                                            "px-2 py-1 rounded-md text-xs",
                                                            visual?.badge ?? "bg-gray-100 text-gray-700 border border-gray-200 font-medium",
                                                        ].join(" ")}
                                                    >
                      {activityLabel(r?.activity_code)}
                    </span>

                                                    {off && <span className="text-xs text-gray-500">(times disabled)</span>}
                                                </div>
                                            </td>

                                            <td className="p-3">
                                                <select
                                                    className="rounded border px-2 py-1"
                                                    value={r?.activity_code ?? "TESTING"}
                                                    onChange={(e) => updateWeekday(weekday, { activity_code: e.target.value })}
                                                    disabled={loading || saving || !r}
                                                >
                                                    {activityOptions.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td className="p-3">
                                                <input
                                                    type="time"
                                                    className={["rounded border px-2 py-1", off ? "bg-gray-50 text-gray-400" : ""].join(" ")}
                                                    value={(r?.start_time ?? "").slice(0, 5)}
                                                    onChange={(e) =>
                                                        updateWeekday(weekday, { start_time: e.target.value ? `${e.target.value}:00` : null })
                                                    }
                                                    disabled={loading || saving || !r || off}
                                                />
                                            </td>

                                            <td className="p-3">
                                                <input
                                                    type="time"
                                                    className={["rounded border px-2 py-1", off ? "bg-gray-50 text-gray-400" : ""].join(" ")}
                                                    value={(r?.end_time ?? "").slice(0, 5)}
                                                    onChange={(e) =>
                                                        updateWeekday(weekday, { end_time: e.target.value ? `${e.target.value}:00` : null })
                                                    }
                                                    disabled={loading || saving || !r || off}
                                                />
                                            </td>

                                            <td className="p-3">
                                                <input
                                                    className={["w-full min-w-[180px] rounded border px-2 py-1", off ? "bg-gray-50" : ""].join(" ")}
                                                    value={r?.note ?? ""}
                                                    onChange={(e) => updateWeekday(weekday, { note: e.target.value || null })}
                                                    disabled={loading || saving || !r}
                                                    placeholder="Optional"
                                                />
                                            </td>

                                            <td className="p-3 text-xs text-gray-600">
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
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {weekdayNames.map((dayName, weekday) => {
                                const r = weekdayMap.get(weekday);
                                const visual = activityVisuals[r?.activity_code ?? ""];
                                const off = isDayOff(r?.activity_code);

                                return (
                                    <div
                                        key={weekday}
                                        className={[
                                            "rounded-lg border bg-white p-4 shadow-sm transition-all duration-150",
                                            "hover:-translate-y-[1px] hover:shadow-md",
                                            visual?.row ?? "",
                                            visual?.muted ? "opacity-80" : "",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className={["text-base", off ? "font-bold" : "font-semibold"].join(" ")}>
                                                    {dayName}
                                                </div>

                                                <div className="mt-2">
                  <span
                      className={[
                          "inline-flex px-2 py-1 rounded-md text-xs",
                          visual?.badge ?? "bg-gray-100 text-gray-700 border border-gray-200 font-medium",
                      ].join(" ")}
                  >
                    {activityLabel(r?.activity_code)}
                  </span>

                                                    {off && <span className="ml-2 text-xs text-gray-500">(times disabled)</span>}
                                                </div>
                                            </div>

                                            <select
                                                className="rounded border px-2 py-1 text-sm"
                                                value={r?.activity_code ?? "TESTING"}
                                                onChange={(e) => updateWeekday(weekday, { activity_code: e.target.value })}
                                                disabled={loading || saving || !r}
                                            >
                                                {activityOptions.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-3">
                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">Start</div>
                                                <input
                                                    type="time"
                                                    className={["w-full rounded border px-2 py-1", off ? "bg-gray-50 text-gray-400" : ""].join(" ")}
                                                    value={(r?.start_time ?? "").slice(0, 5)}
                                                    onChange={(e) =>
                                                        updateWeekday(weekday, { start_time: e.target.value ? `${e.target.value}:00` : null })
                                                    }
                                                    disabled={loading || saving || !r || off}
                                                />
                                            </div>

                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">End</div>
                                                <input
                                                    type="time"
                                                    className={["w-full rounded border px-2 py-1", off ? "bg-gray-50 text-gray-400" : ""].join(" ")}
                                                    value={(r?.end_time ?? "").slice(0, 5)}
                                                    onChange={(e) =>
                                                        updateWeekday(weekday, { end_time: e.target.value ? `${e.target.value}:00` : null })
                                                    }
                                                    disabled={loading || saving || !r || off}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <div className="text-xs text-gray-500 mb-1">Note</div>
                                            <input
                                                className={["w-full rounded border px-2 py-1", off ? "bg-gray-50" : ""].join(" ")}
                                                value={r?.note ?? ""}
                                                onChange={(e) => updateWeekday(weekday, { note: e.target.value || null })}
                                                disabled={loading || saving || !r}
                                                placeholder="Optional"
                                            />
                                        </div>

                                        <div className="mt-3 text-xs text-gray-600">
                                            {r?.effective_from ?? "-"}
                                            {r?.effective_to ? ` → ${r?.effective_to}` : ""}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="mt-4 text-xs text-gray-500">
                    Saving creates a new weekly ruleset effective from the selected date (history preserved).
                </div>
            </div>
        </div>
    );
}