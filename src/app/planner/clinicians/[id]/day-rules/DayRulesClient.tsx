"use client"

import {useEffect, useMemo, useState} from "react";

type DayRuleRow = {
    id: number | null;
    weekday: number;
    activity_code: string;
    start_time: string | null;
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

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Activity Codes
const activityOptions = [
    {value: "ADMIN", label: "Admin"},
    {value: "TESTING", label: "Testing"},
    {value: "DO", label: "Day Off"},
    {value: "SG", label: "SG"},
    {value: "CL", label: "CL Testing"},
    {value: "GF_DAY", label: "Ground Floor"},
];


function toLocalISODate(d: Date) {
    // "YYYY-MM-DD" in user's local timezone
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export default function DayRulesClient({ clinicianId }: { clinicianId: number }) {
    const [date, setDate] = useState<string>(() => toLocalISODate(new Date()));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [weekly, setWeekly] = useState<DayRuleRow[]>([]);

    const weekdayMap = useMemo(() => {
        const m = new Map<number, DayRuleRow>();
        for (const r of weekly) m.set(r.weekday, r);
        return m;
    }, [weekly]);

    async function load() {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `/planner/api/clinicians/${clinicianId}/day-rules?date=${encodeURIComponent(date)}`,
                { cache: "no-store" }
            );

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = (await res.json()) as ApiResponse;

            // ensure sorted 0-6
            const sorted = [...(json.weekly ?? [])].sort((a, b) => a.weekday - b.weekday);
            setWeekly(sorted);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load day rules");
            setWeekly([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clinicianId, date]);

    function updateWeekday(weekday: number, patch: Partial<DayRuleRow>) {
        setWeekly((prev) =>
            prev.map((r) => (r.weekday === weekday ? { ...r, ...patch } : r))
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg border bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <div className="text-sm text-gray-500">View rules as of</div>
                        <div className="text-lg font-semibold">Weekly Day Rules</div>
                    </div>

                    <div className="flex items-end gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="rounded border px-3 py-2 text-sm"
                            />
                        </div>

                        <button
                            onClick={load}
                            className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
                            disabled={loading}
                            title="Reload"
                        >
                            {loading ? "Loading…" : "Refresh"}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="text-left p-3">Day</th>
                            <th className="text-left p-3">Activity</th>
                            <th className="text-left p-3">Start</th>
                            <th className="text-left p-3">End</th>
                            <th className="text-left p-3">Note</th>
                            <th className="text-left p-3">Effective From</th>
                            <th className="text-left p-3">Effective To</th>
                        </tr>
                        </thead>

                        <tbody>
                        {weekdayNames.map((dayName, weekday) => {
                            const r = weekdayMap.get(weekday);

                            return (
                                <tr key={weekday} className="border-t">
                                    <td className="p-3 font-medium">{dayName}</td>

                                    <td className="p-3">
                                        <select
                                            className="rounded border px-2 py-1"
                                            value={r?.activity_code ?? "CLINIC"}
                                            onChange={(e) => updateWeekday(weekday, { activity_code: e.target.value })}
                                            disabled={loading || !r}
                                            title={!r ? "No rule found for this day (using default)" : undefined}
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
                                            className="rounded border px-2 py-1"
                                            value={(r?.start_time ?? "").slice(0, 5)}
                                            onChange={(e) =>
                                                updateWeekday(weekday, { start_time: e.target.value ? `${e.target.value}:00` : null })
                                            }
                                            disabled={loading || !r}
                                        />
                                    </td>

                                    <td className="p-3">
                                        <input
                                            type="time"
                                            className="rounded border px-2 py-1"
                                            value={(r?.end_time ?? "").slice(0, 5)}
                                            onChange={(e) =>
                                                updateWeekday(weekday, { end_time: e.target.value ? `${e.target.value}:00` : null })
                                            }
                                            disabled={loading || !r}
                                        />
                                    </td>

                                    <td className="p-3">
                                        <input
                                            className="w-full min-w-[180px] rounded border px-2 py-1"
                                            value={r?.note ?? ""}
                                            onChange={(e) => updateWeekday(weekday, { note: e.target.value || null })}
                                            disabled={loading || !r}
                                            placeholder="Optional"
                                        />
                                    </td>

                                    <td className="p-3 text-gray-600">{r?.effective_from ?? "-"}</td>
                                    <td className="p-3 text-gray-600">{r?.effective_to ?? "-"}</td>
                                </tr>
                            );
                        })}

                        {weekly.length === 0 && !loading && !error && (
                            <tr>
                                <td className="p-6 text-gray-500" colSpan={7}>
                                    No rules returned.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                    Editing is local for now — saving comes in Step 4.
                </div>
            </div>
        </div>
    );
}