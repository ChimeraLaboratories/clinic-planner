"use client";

import type { PlannerResponse } from "../types/planner";
import TopBar from "./TopBar";
import ViewTabs from "./ViewTabs";
import MonthGrid from "./MonthGrid";

export default function PlannerShell({
                                         anchorMonth,
                                         onPrevMonth,
                                         onNextMonth,
                                         data,
                                         loading,
                                         error,
                                     }: {
    anchorMonth: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    data: PlannerResponse | null;
    loading: boolean;
    error: string | null;
}) {
    return (
        <div className="min-h-screen bg-slate-100">
            <TopBar anchorMonth={anchorMonth} onPrevMonth={onPrevMonth} onNextMonth={onNextMonth} />

            <main className="mx-auto max-w-7xl px-6 py-6">
                <div className="rounded-2xl bg-white shadow">
                    <div className="px-6 pt-5">
                        <ViewTabs />
                    </div>

                    <div className="p-6">
                        {loading && <div className="text-slate-600">Loading…</div>}
                        {error && <div className="text-red-600">{error}</div>}
                        {!loading && !error && data && <MonthGrid anchorMonth={anchorMonth} data={data} />}
                    </div>
                </div>
            </main>
        </div>
    );
}