"use client";

import { CalendarDays, Eye, Play } from "lucide-react";

export function SchedulerControlPanel() {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[220px_220px_280px_1fr_auto]">
                <div>
                    <label className="mb-3 block text-sm font-medium text-slate-600">
                        Schedule
                    </label>

                    <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                        <button className="flex-1 rounded-md px-4 py-2 text-sm font-semibold text-slate-700">
                            Single Day
                        </button>

                        <button className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                            Whole Month
                        </button>
                    </div>
                </div>

                <SelectBox label="Month" value="September 2026" />
                <SelectBox label="Date Range" value="01/09/2026 – 30/09/2026" />

                <div>
                    <label className="mb-3 block text-sm font-medium text-slate-600">
                        Options
                    </label>

                    <div className="space-y-3 text-sm font-medium text-slate-700">
                        <label className="flex items-center gap-3">
                            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                            Overwrite existing auto-generated draft sessions
                        </label>

                        <label className="flex items-center gap-3">
                            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                            Include unallocated sessions
                        </label>
                    </div>
                </div>

                <div className="flex items-end gap-3">
                    <button className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                        <Eye size={17} />
                        Preview
                    </button>

                    <button className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                        <Play size={17} />
                        Apply
                    </button>
                </div>
            </div>
        </section>
    );
}

function SelectBox({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <label className="mb-3 block text-sm font-medium text-slate-600">
                {label}
            </label>

            <button className="flex h-11 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm">
        <span className="flex items-center gap-3">
          <CalendarDays size={18} />
            {value}
        </span>

                <span className="text-slate-500">⌄</span>
            </button>
        </div>
    );
}