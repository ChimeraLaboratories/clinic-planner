"use client";

import { useMemo, useState } from "react";

type DayResult = {
    date: string;
    pattern: string;
    allocations: Array<{
        room_id: number;
        room_name: string;
        clinician_id: number;
        clinician_name: string;
        session_type: string;
        slot: string;
        notes: string;
    }>;
    unfilled: Array<{
        room_id: number;
        room_name: string;
        slot: string;
        session_type: string;
        reason: string;
    }>;
    warnings: string[];
    stats: {
        requested: number;
        allocated: number;
        unallocated: number;
    };
};

type MonthResult = {
    from: string;
    to: string;
    days: DayResult[];
    summary: {
        totalDays: number;
        totalRequested: number;
        totalAllocated: number;
        totalUnallocated: number;
        totalWarnings: number;
    };
};

type Mode = "day" | "month";

function todayYmd() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function currentMonth() {
    return todayYmd().slice(0, 7);
}

export default function AutoSchedulerClient() {
    const [mode, setMode] = useState<Mode>("day");
    const [date, setDate] = useState(todayYmd());
    const [month, setMonth] = useState(currentMonth());
    const [overwriteExisting, setOverwriteExisting] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [dayPreview, setDayPreview] = useState<DayResult | null>(null);
    const [monthPreview, setMonthPreview] = useState<MonthResult | null>(null);

    const totalRows = useMemo(() => {
        if (mode === "day") return dayPreview?.allocations.length ?? 0;
        return monthPreview?.days.reduce((n, d) => n + d.allocations.length, 0) ?? 0;
    }, [mode, dayPreview, monthPreview]);

    async function run(endpoint: string, body: any) {
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json?.error || "Request failed");
            }

            return json;
        } catch (e: any) {
            setError(e?.message || "Request failed");
            return null;
        } finally {
            setLoading(false);
        }
    }

    async function handlePreview() {
        setDayPreview(null);
        setMonthPreview(null);

        if (mode === "day") {
            const json = await run("/planner/api/auto-schedule/day/preview", {
                date,
                overwriteExisting,
            });
            if (json) setDayPreview(json);
            return;
        }

        const json = await run("/planner/api/auto-schedule/month/preview", {
            month,
            overwriteExisting,
        });
        if (json) setMonthPreview(json);
    }

    async function handleApply() {
        if (mode === "day") {
            const json = await run("/planner/api/auto-schedule/day/apply", {
                date,
                overwriteExisting,
            });

            if (json) {
                setDayPreview(json.result);
                setMessage(`Created ${json.created} session(s).`);
            }
            return;
        }

        const json = await run("/planner/api/auto-schedule/month/apply", {
            month,
            overwriteExisting,
        });

        if (json) {
            setMonthPreview(json.result);
            setMessage(`Created ${json.created} session(s).`);
        }
    }

    return (
        <div className="mx-auto max-w-7xl p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Auto Scheduler</h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Preview or generate automatic clinic plans from your day rules.
                    </p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex gap-2">
                    <button
                        type="button"
                        onClick={() => setMode("day")}
                        className={`rounded-xl px-4 py-2 text-sm font-medium ${
                            mode === "day"
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-700"
                        }`}
                    >
                        Single Day
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("month")}
                        className={`rounded-xl px-4 py-2 text-sm font-medium ${
                            mode === "month"
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-700"
                        }`}
                    >
                        Whole Month
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    {mode === "day" ? (
                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Date</span>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            />
                        </label>
                    ) : (
                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Month</span>
                            <input
                                type="month"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            />
                        </label>
                    )}

                    <label className="flex items-end gap-3">
                        <input
                            type="checkbox"
                            checked={overwriteExisting}
                            onChange={(e) => setOverwriteExisting(e.target.checked)}
                            className="h-4 w-4"
                        />
                        <span className="text-sm text-slate-700">
                            Overwrite existing auto-generated draft sessions
                        </span>
                    </label>

                    <div className="flex items-end gap-2 md:col-span-2">
                        <button
                            type="button"
                            onClick={handlePreview}
                            disabled={loading}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                            {loading ? "Working..." : "Preview"}
                        </button>

                        <button
                            type="button"
                            onClick={handleApply}
                            disabled={loading}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                            {loading ? "Working..." : "Apply"}
                        </button>
                    </div>
                </div>

                {error ? (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {message ? (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {message}
                    </div>
                ) : null}
            </div>

            <div className="mt-6 grid gap-6">
                {mode === "day" && dayPreview ? (
                    <>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="text-sm text-slate-600">
                                    <span className="font-medium text-slate-900">Date:</span> {dayPreview.date}
                                </div>
                                <div className="text-sm text-slate-600">
                                    <span className="font-medium text-slate-900">Pattern:</span> {dayPreview.pattern}
                                </div>
                                <div className="text-sm text-slate-600">
                                    <span className="font-medium text-slate-900">Requested:</span> {dayPreview.stats.requested}
                                </div>
                                <div className="text-sm text-slate-600">
                                    <span className="font-medium text-slate-900">Allocated:</span> {dayPreview.stats.allocated}
                                </div>
                                <div className="text-sm text-slate-600">
                                    <span className="font-medium text-slate-900">Unallocated:</span> {dayPreview.stats.unallocated}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900">Planned Sessions</h2>
                            {dayPreview.allocations.length === 0 ? (
                                <p className="text-sm text-slate-500">No planned sessions.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                        <tr className="border-b border-slate-200 text-left text-slate-600">
                                            <th className="px-3 py-2">Room</th>
                                            <th className="px-3 py-2">Slot</th>
                                            <th className="px-3 py-2">Type</th>
                                            <th className="px-3 py-2">Clinician</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {dayPreview.allocations.map((row, idx) => (
                                            <tr key={`${row.room_id}-${row.slot}-${idx}`} className="border-b border-slate-100">
                                                <td className="px-3 py-2">{row.room_name}</td>
                                                <td className="px-3 py-2">{row.slot}</td>
                                                <td className="px-3 py-2">{row.session_type}</td>
                                                <td className="px-3 py-2">{row.clinician_name}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900">Unfilled</h2>
                            {dayPreview.unfilled.length === 0 ? (
                                <p className="text-sm text-emerald-600">No unfilled room demands.</p>
                            ) : (
                                <div className="space-y-2">
                                    {dayPreview.unfilled.map((item, idx) => (
                                        <div
                                            key={`${item.room_id}-${item.slot}-${idx}`}
                                            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                                        >
                                            {item.room_name} {item.slot} ({item.session_type}) — {item.reason}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900">Warnings</h2>
                            {dayPreview.warnings.length === 0 ? (
                                <p className="text-sm text-emerald-600">No warnings.</p>
                            ) : (
                                <div className="space-y-2">
                                    {dayPreview.warnings.map((warning, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                                        >
                                            {warning}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : null}

                {mode === "month" && monthPreview ? (
                    <>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="text-sm text-slate-600">
                                    <span className="font-medium text-slate-900">From:</span> {monthPreview.from}
                                </div>
                                <div className="text-sm text-slate-600">
                                    <span className="font-medium text-slate-900">To:</span> {monthPreview.to}
                                </div>
                                <div className="text-sm text-slate-600">
                                    <span className="font-medium text-slate-900">Days:</span> {monthPreview.summary.totalDays}
                                </div>
                                <div className="text-sm text-slate-600">
                                    <span className="font-medium text-slate-900">Requested:</span> {monthPreview.summary.totalRequested}
                                </div>
                                <div className="text-sm text-slate-600">
                                    <span className="font-medium text-slate-900">Allocated:</span> {monthPreview.summary.totalAllocated}
                                </div>
                                <div className="text-sm text-slate-600">
                                    <span className="font-medium text-slate-900">Unallocated:</span> {monthPreview.summary.totalUnallocated}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900">
                                Month Breakdown ({totalRows} planned sessions)
                            </h2>

                            <div className="space-y-4">
                                {monthPreview.days.map((day) => (
                                    <div key={day.date} className="rounded-2xl border border-slate-200 p-4">
                                        <div className="mb-3 flex flex-wrap items-center gap-3">
                                            <div className="font-medium text-slate-900">{day.date}</div>
                                            <div className="text-sm text-slate-500">{day.pattern}</div>
                                            <div className="text-sm text-slate-500">
                                                {day.stats.allocated}/{day.stats.requested} allocated
                                            </div>
                                        </div>

                                        {day.allocations.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full text-sm">
                                                    <thead>
                                                    <tr className="border-b border-slate-200 text-left text-slate-600">
                                                        <th className="px-3 py-2">Room</th>
                                                        <th className="px-3 py-2">Slot</th>
                                                        <th className="px-3 py-2">Type</th>
                                                        <th className="px-3 py-2">Clinician</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {day.allocations.map((row, idx) => (
                                                        <tr key={`${day.date}-${row.room_id}-${row.slot}-${idx}`} className="border-b border-slate-100">
                                                            <td className="px-3 py-2">{row.room_name}</td>
                                                            <td className="px-3 py-2">{row.slot}</td>
                                                            <td className="px-3 py-2">{row.session_type}</td>
                                                            <td className="px-3 py-2">{row.clinician_name}</td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500">No allocations for this day.</p>
                                        )}

                                        {day.unfilled.length > 0 ? (
                                            <div className="mt-3 space-y-2">
                                                {day.unfilled.map((item, idx) => (
                                                    <div
                                                        key={`${day.date}-${item.room_id}-${item.slot}-${idx}`}
                                                        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
                                                    >
                                                        {item.room_name} {item.slot} ({item.session_type}) — {item.reason}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}