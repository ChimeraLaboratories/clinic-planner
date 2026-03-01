"use client";

import type { PlannerResponse } from "../types/planner";
import TopBar from "./TopBar";
import ViewTabs from "./ViewTabs";
import MonthGrid from "./MonthGrid";

export default function PlannerShell({anchorMonth, onPrevMonth, onNextMonth, data, loading, error, onRefresh,}: {
    anchorMonth: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    data: PlannerResponse | null;
    loading: boolean;
    error: string | null;
    onRefresh: () => void | Promise<void>;
}) {
    return (
        <div className="min-h-screen bg-slate-100">
            <TopBar anchorMonth={anchorMonth} onPrevMonth={onPrevMonth} onNextMonth={onNextMonth} />

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
                    <div className="px-6 pt-5">
                        <ViewTabs />
                    </div>

                    <div className="p-6">
                        {loading && <div className="text-slate-600">Loading…</div>}
                        {error && <div className="text-red-600">{error}</div>}
                        {!loading && !error && data && <MonthGrid anchorMonth={anchorMonth} data={data} onRefresh={onRefresh}/>}
                    </div>
                </div>
            </main>
        </div>
    );
}