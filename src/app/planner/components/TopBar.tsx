"use client";

import { formatMonthTitle } from "../utils/date";
import Link from "next/link";

export default function TopBar({
                                   anchorMonth,
                                   onPrevMonth,
                                   onNextMonth,
                                   onCurrentMonth,
                               }: {
    anchorMonth: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onCurrentMonth: () => void;
}) {
    const today = new Date();

    const isCurrentMonth =
        today.getMonth() === anchorMonth.getMonth() &&
        today.getFullYear() === anchorMonth.getFullYear();

    return (
        <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

                {/* LEFT — Logo + Brand */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
            <span className="text-sm font-bold text-white tracking-wide">
              CP
            </span>
                    </div>

                    <div className="flex flex-col leading-tight">
            <span className="text-lg font-semibold text-slate-900">
              Clinic Planner
            </span>
                        <span className="text-xs text-slate-500">
              Scheduling & Capacity Management
            </span>
                    </div>
                </div>

                {/* CENTER — Month Navigation */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onPrevMonth}
                        className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                    >
                        ‹
                    </button>

                    <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-white px-5 shadow-sm">
            <span className="text-sm font-semibold text-slate-800">
              {formatMonthTitle(anchorMonth)}
            </span>
                    </div>

                    <button
                        onClick={onNextMonth}
                        className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                    >
                        ›
                    </button>

                    <button
                        onClick={onCurrentMonth}
                        disabled={isCurrentMonth}
                        className={`ml-2 h-9 rounded-lg px-4 text-sm font-medium shadow-sm transition ${
                            isCurrentMonth
                                ? "cursor-default border border-slate-200 bg-slate-100 text-slate-400"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                        Current Month
                    </button>
                </div>

                {/* RIGHT — Actions */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/planner/clinicians"
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        Clinician Management
                    </Link>
                </div>
            </div>
        </header>
    );
}