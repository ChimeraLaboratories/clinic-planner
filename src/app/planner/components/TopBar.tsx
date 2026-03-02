"use client";

import { formatMonthTitle } from "../utils/date";
import Link from "next/link";

export default function TopBar({
                                   anchorMonth,
                                   onPrevMonth,
                                   onNextMonth,
                                   onCurrentMonth,   // 👈 add this
                               }: {
    anchorMonth: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onCurrentMonth: () => void;  // 👈 add this
}) {

    const today = new Date();
    const isCurrentMonth =
        today.getMonth() === anchorMonth.getMonth() &&
        today.getFullYear() === anchorMonth.getFullYear();

    return (
        <header className="bg-white border-b border-slate-200 shadow-sm">
            <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">

                {/* Left Logo */}
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-600" />
                    <div className="font-semibold text-slate-900">Clinic Planner</div>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center gap-3">
                    <button onClick={onPrevMonth} className="h-9 px-3 rounded-lg border bg-white">
                        ‹
                    </button>

                    <div className="h-9 px-4 rounded-lg border bg-white flex items-center">
                        <span className="font-medium">
                            {formatMonthTitle(anchorMonth)}
                        </span>
                    </div>

                    <button onClick={onNextMonth} className="h-9 px-3 rounded-lg border bg-white">
                        ›
                    </button>

                    {/* ✅ Current Month Button */}
                    <button
                        onClick={onCurrentMonth}
                        disabled={isCurrentMonth}
                        className={`h-9 px-4 rounded-lg text-sm font-medium transition
                            ${
                            isCurrentMonth
                                ? "bg-slate-100 text-slate-400 border cursor-default"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                        Current Month
                    </button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/planner/clinicians"
                        className="inline-flex items-center px-3 py-2 rounded border text-sm"
                    >
                        Clinicians
                    </Link>

                    <button className="inline-flex items-center px-3 py-2 rounded border text-sm">
                        Export
                    </button>

                    <button className="inline-flex items-center px-3 py-2 rounded border text-sm">
                        Publish
                    </button>
                </div>
            </div>
        </header>
    );
}