"use client";

import { formatMonthTitle } from "../utils/date";

export default function TopBar({
                                   anchorMonth,
                                   onPrevMonth,
                                   onNextMonth,
                               }: {
    anchorMonth: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}) {
    return (
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
            <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-600" />
                    <div className="font-semibold text-slate-900">Clinic Planner</div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={onPrevMonth} className="h-9 px-3 rounded-lg border bg-white">
                        ‹
                    </button>
                    <div className="h-9 px-4 rounded-lg border bg-white flex items-center">
                        <span className="font-medium">{formatMonthTitle(anchorMonth)}</span>
                    </div>
                    <button onClick={onNextMonth} className="h-9 px-3 rounded-lg border bg-white">
                        ›
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button className="h-9 px-4 rounded-lg border bg-white">Import</button>
                    <button className="h-9 px-4 rounded-lg border bg-white">Export</button>
                    <button className="h-9 px-4 rounded-lg border bg-white">Publish</button>
                </div>
            </div>
        </header>
    );
}