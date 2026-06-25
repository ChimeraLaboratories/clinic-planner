"use client";

import { useMemo, useState } from "react";
import {
    AlertTriangle,
    CalendarDays,
    Check,
    ChevronRight,
    Eye,
    History,
    Minus,
    Play,
    Sparkles,
} from "lucide-react";

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
    return d.toISOString().slice(0, 10);
}

function currentMonth() {
    return todayYmd().slice(0, 7);
}

function formatMonthTitle(month: string) {
    const date = new Date(`${month}-01T12:00:00`);
    return date.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
    });
}

function formatDateTitle(date: string) {
    const d = new Date(`${date}T12:00:00`);
    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function formatDayLabel(date: string) {
    const d = new Date(`${date}T12:00:00`);
    const day = String(d.getDate()).padStart(2, "0");
    const weekday = d.toLocaleDateString("en-GB", { weekday: "short" });
    return `${day} ${weekday}`;
}

function formatWeekday(date: string) {
    return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
        weekday: "long",
    });
}

function allocationRate(requested: number, allocated: number) {
    if (!requested) return 0;
    return Math.round((allocated / requested) * 1000) / 10;
}

export default function AutoSchedulerClient() {
    const [mode, setMode] = useState<Mode>("month");
    const [date, setDate] = useState(todayYmd());
    const [month, setMonth] = useState(currentMonth());
    const [overwriteExisting, setOverwriteExisting] = useState(false);
    const [includeUnallocated, setIncludeUnallocated] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [dayPreview, setDayPreview] = useState<DayResult | null>(null);
    const [monthPreview, setMonthPreview] = useState<MonthResult | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>("");

    const activeDays = mode === "month" ? monthPreview?.days ?? [] : dayPreview ? [dayPreview] : [];

    const selectedDay = useMemo(() => {
        if (mode === "day") return dayPreview;
        return activeDays.find((d) => d.date === selectedDate) ?? activeDays.find((d) => d.stats.unallocated > 0) ?? activeDays[0];
    }, [activeDays, dayPreview, mode, selectedDate]);

    const summary = useMemo(() => {
        if (mode === "month" && monthPreview) {
            return {
                requested: monthPreview.summary.totalRequested,
                allocated: monthPreview.summary.totalAllocated,
                unallocated: monthPreview.summary.totalUnallocated,
                warnings: monthPreview.summary.totalWarnings,
            };
        }

        if (dayPreview) {
            return {
                requested: dayPreview.stats.requested,
                allocated: dayPreview.stats.allocated,
                unallocated: dayPreview.stats.unallocated,
                warnings: dayPreview.warnings.length,
            };
        }

        return {
            requested: 0,
            allocated: 0,
            unallocated: 0,
            warnings: 0,
        };
    }, [dayPreview, monthPreview, mode]);

    async function run(endpoint: string, body: unknown) {
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
        } catch (e) {
            setError(e instanceof Error ? e.message : "Request failed");
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
                includeUnallocated,
            });

            if (json) {
                setDayPreview(json);
                setSelectedDate(json.date);
            }

            return;
        }

        const json = await run("/planner/api/auto-schedule/month/preview", {
            month,
            overwriteExisting,
            includeUnallocated,
        });

        if (json) {
            setMonthPreview(json);
            setSelectedDate(json.days?.find((d: DayResult) => d.stats.unallocated > 0)?.date ?? json.days?.[0]?.date ?? "");
        }
    }

    async function handleApply() {
        if (mode === "day") {
            const json = await run("/planner/api/auto-schedule/day/apply", {
                date,
                overwriteExisting,
                includeUnallocated,
            });

            if (json) {
                setDayPreview(json.result);
                setSelectedDate(json.result.date);
                setMessage(`Created ${json.created} session(s).`);
            }

            return;
        }

        const json = await run("/planner/api/auto-schedule/month/apply", {
            month,
            overwriteExisting,
            includeUnallocated,
        });

        if (json) {
            setMonthPreview(json.result);
            setSelectedDate(json.result.days?.find((d: DayResult) => d.stats.unallocated > 0)?.date ?? json.result.days?.[0]?.date ?? "");
            setMessage(`Created ${json.created} session(s).`);
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 px-10 py-8 text-slate-950">
            <div className="mx-auto max-w-[1660px]">
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Auto Scheduler</h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Generate or preview automatic clinic plans based on your day rules, room availability and allocation preferences.
                        </p>
                    </div>

                    <button className="text-sm font-medium text-slate-500 hover:text-blue-700">
                        ⓘ How it works
                    </button>
                </div>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[260px_260px_300px_1fr_auto]">
                        <div>
                            <label className="mb-3 block text-sm font-medium text-slate-600">Schedule</label>
                            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                                <button
                                    onClick={() => setMode("day")}
                                    className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold ${
                                        mode === "day" ? "bg-blue-600 text-white shadow-sm" : "text-slate-700"
                                    }`}
                                >
                                    Single Day
                                </button>
                                <button
                                    onClick={() => setMode("month")}
                                    className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold ${
                                        mode === "month" ? "bg-blue-600 text-white shadow-sm" : "text-slate-700"
                                    }`}
                                >
                                    Whole Month
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="mb-3 block text-sm font-medium text-slate-600">
                                {mode === "day" ? "Date" : "Month"}
                            </label>
                            <div className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 shadow-sm">
                                <CalendarDays size={18} />
                                <input
                                    type={mode === "day" ? "date" : "month"}
                                    value={mode === "day" ? date : month}
                                    onChange={(e) => (mode === "day" ? setDate(e.target.value) : setMonth(e.target.value))}
                                    className="w-full bg-transparent text-sm font-semibold outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-3 block text-sm font-medium text-slate-600">Date Range</label>
                            <div className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold shadow-sm">
                                <CalendarDays size={18} />
                                {mode === "day" ? date : `${month}-01 – ${month}`}
                            </div>
                        </div>

                        <div>
                            <label className="mb-3 block text-sm font-medium text-slate-600">Options</label>
                            <div className="space-y-3 text-sm font-medium text-slate-700">
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={overwriteExisting}
                                        onChange={(e) => setOverwriteExisting(e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300"
                                    />
                                    Overwrite existing auto-generated draft sessions
                                </label>

                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={includeUnallocated}
                                        onChange={(e) => setIncludeUnallocated(e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300"
                                    />
                                    Include unallocated sessions
                                </label>
                            </div>
                        </div>

                        <div className="flex items-end gap-3">
                            <button
                                onClick={handlePreview}
                                disabled={loading}
                                className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                            >
                                <Eye size={17} />
                                {loading ? "Working..." : "Preview"}
                            </button>

                            <button
                                onClick={handleApply}
                                disabled={loading}
                                className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                            >
                                <Play size={17} />
                                {loading ? "Working..." : "Apply"}
                            </button>
                        </div>
                    </div>
                </section>

                {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
                {message && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div>}

                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_520px]">
                    <MonthCalendar
                        title={mode === "month" ? formatMonthTitle(month) : formatDateTitle(date)}
                        days={activeDays}
                        selectedDate={selectedDay?.date ?? ""}
                        onSelect={setSelectedDate}
                    />

                    <SummaryPanel summary={summary} />
                </div>

                {selectedDay && (
                    <div className="mt-6">
                        <DayPanel day={selectedDay} />
                    </div>
                )}
            </div>
        </main>
    );
}

function MonthCalendar({
                           title,
                           days,
                           selectedDate,
                           onSelect,
                       }: {
    title: string;
    days: DayResult[];
    selectedDate: string;
    onSelect: (date: string) => void;
}) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white">
                        <CalendarDays size={18} />
                    </div>
                    <h2 className="text-xl font-bold">{title}</h2>
                </div>

                <div className="flex items-center gap-5 text-xs font-medium text-slate-500">
                    <Legend colour="bg-emerald-500" label="Fully Allocated" />
                    <Legend colour="bg-amber-500" label="Issues" />
                    <Legend colour="bg-slate-300" label="No Sessions" />
                </div>
            </div>

            {days.length === 0 ? (
                <div className="grid min-h-[420px] place-items-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500">
                    Press Preview to load real scheduler data.
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-7">
                    {days.map((day) => {
                        const requested = day.stats.requested;
                        const allocated = day.stats.allocated;
                        const unallocated = day.stats.unallocated;
                        const status = requested === 0 ? "none" : unallocated > 0 ? "issue" : "ok";

                        return (
                            <button
                                key={day.date}
                                onClick={() => onSelect(day.date)}
                                className={`rounded-lg border bg-white p-3 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md ${
                                    selectedDate === day.date ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"
                                }`}
                            >
                                <div className="mb-3 text-center text-sm font-semibold text-slate-700">{formatDayLabel(day.date)}</div>

                                <div className="flex items-center justify-center gap-2">
                                    <StatusIcon status={status} />
                                    <span className="text-sm font-bold">
                    {allocated} / {requested}
                  </span>
                                </div>

                                <p className={`mt-1 text-center text-xs font-medium ${status === "ok" ? "text-emerald-600" : "text-slate-500"}`}>
                                    {status === "ok" ? "Allocated" : status === "issue" ? `${unallocated} Unallocated` : "No sessions"}
                                </p>
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

function SummaryPanel({
                          summary,
                      }: {
    summary: {
        requested: number;
        allocated: number;
        unallocated: number;
        warnings: number;
    };
}) {
    const rate = allocationRate(summary.requested, summary.allocated);

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue-600">
                    <Sparkles size={20} />
                </div>
                <h2 className="text-lg font-bold">Scheduling Summary</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <MetricCard label="Requested" value={summary.requested} suffix="sessions" tone="green" />
                <MetricCard label="Allocated" value={summary.allocated} suffix="sessions" tone="green" />
                <MetricCard label="Unallocated" value={summary.unallocated} suffix="sessions" tone="red" />
                <MetricCard label="Allocation Rate" value={`${rate}%`} tone="blue" />
            </div>

            <hr className="my-6 border-slate-200" />

            <h3 className="mb-4 font-bold">What happens next?</h3>
            <ol className="space-y-4 text-sm text-slate-600">
                {[
                    "Preview shows the estimated allocation for the selected period.",
                    "Review any days with unallocated sessions to understand why.",
                    "Click Apply to generate or update the auto-generated sessions.",
                ].map((item, index) => (
                    <li key={item} className="flex gap-3">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">{index + 1}</span>
                        {item}
                    </li>
                ))}
            </ol>

            <hr className="my-6 border-slate-200" />

            <div>
                <h3 className="mb-3 font-bold">Last run</h3>
                <div className="flex items-center justify-between gap-4">
                    <p className="flex items-center gap-3 text-sm text-slate-700">
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-xs text-white">✓</span>
                        Real scheduler preview data
                    </p>

                    <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm hover:bg-slate-50">
                        <History size={17} />
                        View history
                    </button>
                </div>
            </div>
        </section>
    );
}

function DayPanel({ day }: { day: DayResult }) {
    const rate = allocationRate(day.stats.requested, day.stats.allocated);
    const stRequested = day.allocations.filter((a) => a.session_type === "ST").length + day.unfilled.filter((u) => u.session_type === "ST").length;
    const stAllocated = day.allocations.filter((a) => a.session_type === "ST").length;
    const clRequested = day.allocations.filter((a) => a.session_type === "CL").length + day.unfilled.filter((u) => u.session_type === "CL").length;
    const clAllocated = day.allocations.filter((a) => a.session_type === "CL").length;

    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold">{formatDateTitle(day.date)}</h2>
                    <span className="text-slate-600">({formatWeekday(day.date)})</span>

                    {day.stats.unallocated > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
              <AlertTriangle size={14} />
                            {day.stats.unallocated} Unallocated Session
            </span>
                    )}
                </div>

                <a
                    href={`/planner/${day.date}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-slate-50"
                >
                    View full day details
                    <ChevronRight size={17} />
                </a>
            </div>

            <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-[170px_170px_170px_190px_1fr_1.2fr] md:divide-x md:divide-y-0">
                <SmallMetric title="Requested" value={day.stats.requested} suffix="sessions" />
                <SmallMetric title="Allocated" value={day.stats.allocated} suffix="sessions" green />
                <SmallMetric title="Unallocated" value={day.stats.unallocated} suffix="session" red />

                <div className="p-4 text-center">
                    <div className="text-xs font-semibold text-slate-500">Allocation Rate</div>
                    <div className="mt-4 text-2xl font-bold">{rate}%</div>
                    <div className="mx-auto mt-3 h-2 w-28 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${rate}%` }} />
                    </div>
                </div>

                <div className="p-4">
                    <div className="mb-4 text-xs font-semibold text-slate-500">Breakdown by Clinic Type</div>
                    <Breakdown label="ST" allocated={stAllocated} requested={stRequested} />
                    <Breakdown label="CL" allocated={clAllocated} requested={clRequested} green />
                </div>

                <div className="p-4">
                    <div className="mb-4 text-xs font-semibold text-slate-500">Issues</div>

                    {day.unfilled.length === 0 && day.warnings.length === 0 ? (
                        <p className="text-sm font-semibold text-emerald-600">No issues found.</p>
                    ) : (
                        <div className="space-y-3">
                            {day.unfilled.map((item, index) => (
                                <div key={`${item.room_id}-${item.slot}-${index}`} className="flex gap-3">
                                    <AlertTriangle size={17} className="mt-0.5 text-amber-500" fill="currentColor" />
                                    <div>
                                        <p className="text-sm font-bold">
                                            1 {item.session_type} session could not be allocated
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">Reason: {item.reason}</p>
                                    </div>
                                </div>
                            ))}

                            {day.warnings.map((warning, index) => (
                                <div key={index} className="flex gap-3">
                                    <AlertTriangle size={17} className="mt-0.5 text-amber-500" fill="currentColor" />
                                    <p className="text-sm font-bold">{warning}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function StatusIcon({ status }: { status: "ok" | "issue" | "none" }) {
    if (status === "ok") {
        return (
            <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white">
        <Check size={11} strokeWidth={3} />
      </span>
        );
    }

    if (status === "issue") {
        return <AlertTriangle size={16} className="text-amber-500" fill="currentColor" />;
    }

    return (
        <span className="grid h-4 w-4 place-items-center rounded-full bg-slate-300 text-white">
      <Minus size={11} strokeWidth={3} />
    </span>
    );
}

function Legend({ colour, label }: { colour: string; label: string }) {
    return (
        <span className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${colour}`} />
            {label}
    </span>
    );
}

function MetricCard({
                        label,
                        value,
                        suffix,
                        tone,
                    }: {
    label: string;
    value: string | number;
    suffix?: string;
    tone: "green" | "red" | "blue";
}) {
    const tones = {
        green: "border-emerald-200 bg-emerald-50 text-emerald-700",
        red: "border-red-200 bg-red-50 text-red-600",
        blue: "border-blue-200 bg-blue-50 text-blue-700",
    };

    return (
        <div className={`rounded-lg border p-4 text-center ${tones[tone]}`}>
            <div className="text-sm font-medium">{label}</div>
            <div className="mt-2 text-3xl font-bold text-slate-950">{value}</div>
            {suffix && <div className="mt-1 text-xs font-semibold">{suffix}</div>}
        </div>
    );
}

function SmallMetric({
                         title,
                         value,
                         suffix,
                         green,
                         red,
                     }: {
    title: string;
    value: number;
    suffix: string;
    green?: boolean;
    red?: boolean;
}) {
    return (
        <div className="p-4 text-center">
            <div className="text-xs font-semibold text-slate-500">{title}</div>
            <div className={`mt-4 text-2xl font-bold ${green ? "text-emerald-600" : red ? "text-red-600" : ""}`}>{value}</div>
            <div className={`text-xs ${green ? "text-emerald-600" : red ? "text-red-600" : "text-slate-500"}`}>{suffix}</div>
        </div>
    );
}

function Breakdown({
                       label,
                       allocated,
                       requested,
                       green,
                   }: {
    label: string;
    allocated: number;
    requested: number;
    green?: boolean;
}) {
    const rate = requested ? Math.round((allocated / requested) * 100) : 0;

    return (
        <div className="mb-3 flex items-center gap-3 text-sm">
            <span className={`h-2 w-2 rounded-full ${green ? "bg-emerald-500" : "bg-blue-600"}`} />
            <span className="w-16 font-semibold">
        {label} {allocated} / {requested}
      </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div className={`h-full rounded-full ${green ? "bg-emerald-500" : "bg-blue-600"}`} style={{ width: `${rate}%` }} />
            </div>
        </div>
    );
}