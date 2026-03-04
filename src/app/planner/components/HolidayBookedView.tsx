"use client";

import { useMemo, useState } from "react";
import type { PlannerResponse } from "../types/planner";

type HolidayRow = {
    id: number | string;
    clinician_id: number;
    clinician_name: string;
    date_from: string;
    date_to: string | null;
    type?: string | null;
    note?: string | null;
};

function monthRange(anchorMonth: Date) {
    const start = new Date(anchorMonth.getFullYear(), anchorMonth.getMonth(), 1);
    const end = new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() + 1, 0);

    const ymd = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };

    return { from: ymd(start), to: ymd(end) };
}

function inRange(d: string, from: string, to: string) {
    return d >= from && d <= to;
}

export default function HolidayBookedView({
                                              anchorMonth,
                                              data,
                                          }: {
    anchorMonth: Date;
    data: PlannerResponse;
}) {
    const [query, setQuery] = useState("");

    const { from, to } = useMemo(() => monthRange(anchorMonth), [anchorMonth]);

    const holidays: HolidayRow[] = useMemo(() => {
        const q = query.trim().toLowerCase();

        return ((data as any)?.holidays ?? [])
            .filter((h: any) => h.date_from && inRange(h.date_from, from, to))
            .filter((h: any) => {
                if (!q) return true;

                return (
                    String(h.clinician_name).toLowerCase().includes(q) ||
                    String(h.date_from).includes(q) ||
                    String(h.date_to ?? "").includes(q) ||
                    String(h.type ?? "").toLowerCase().includes(q) ||
                    String(h.note ?? "").toLowerCase().includes(q)
                );
            })
            .sort((a: any, b: any) =>
                String(a.date_from).localeCompare(String(b.date_from))
            );
    }, [data, from, to, query]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Holidays booked
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        {from} → {to}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search name / date…"
                        className="w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30"
                    />

                    <div className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {holidays.length} total
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <div className="col-span-4">Clinician</div>
                    <div className="col-span-3">From</div>
                    <div className="col-span-3">To</div>
                    <div className="col-span-2 text-right">Type</div>
                </div>

                {holidays.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            No holidays found
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Add a holiday using the "Add Holiday" button.
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {holidays.map((h) => (
                            <div
                                key={String(h.id)}
                                className="grid grid-cols-12 px-4 py-3 text-sm bg-white dark:bg-slate-950"
                            >
                                <div className="col-span-4 font-semibold text-slate-900 dark:text-slate-100">
                                    {h.clinician_name}
                                </div>

                                <div className="col-span-3 text-slate-800 dark:text-slate-200">
                                    {h.date_from}
                                </div>

                                <div className="col-span-3 text-slate-800 dark:text-slate-200">
                                    {h.date_to ?? "—"}
                                </div>

                                <div className="col-span-2 text-right">
                                    <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                        {h.type ?? "Holiday"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}