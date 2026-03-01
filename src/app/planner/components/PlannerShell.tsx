"use client";

import type { PlannerResponse } from "../types/planner";
import TopBar from "./TopBar";
import ViewTabs from "./ViewTabs";
import MonthGrid from "./MonthGrid";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

function getSessionDateKey(s: any): string | null {
    const raw = String(s?.date ?? s?.session_date ?? "").slice(0, 10);
    return raw && raw.length === 10 ? raw : null;
}

function getSessionClinicianId(s: any): number | null {
    const raw = s?.clinician_id ?? s?.clinicianId ?? null;
    if (raw === null || raw === undefined || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

export default function PlannerShell({
                                         anchorMonth,
                                         onPrevMonth,
                                         onNextMonth,
                                         data,
                                         loading,
                                         error,
                                         onRefresh,
                                     }: {
    anchorMonth: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    data: PlannerResponse | null;
    loading: boolean;
    error: string | null;
    onRefresh: () => void | Promise<void>;
}) {
    const router = useRouter();

    // ✅ Build sidebar list here so it's separate from the Month card
    const needsSupervisorDays = useMemo(() => {
        if (!data) return [];

        const clinicianById = new Map<number, any>();
        for (const c of (data.clinicians ?? []) as any[]) {
            clinicianById.set(Number(c.id), c);
        }

        const perDay = new Map<
            string,
            { hasPreRegOO: boolean; hasSupervisorOO: boolean; preRegCount: number }
        >();

        for (const s of (data.sessions ?? []) as any[]) {
            const dateKey = getSessionDateKey(s);
            if (!dateKey) continue;

            const cid = getSessionClinicianId(s);
            const c = cid ? clinicianById.get(cid) : null;

            const role = Number(c?.role_code); // OO=1
            const grade = Number(c?.grade_code); // Registered=1, PreReg=2

            const isOO = role === 1;
            const isPreReg = grade === 2;
            const isRegistered = grade === 1;

            const entry =
                perDay.get(dateKey) ?? { hasPreRegOO: false, hasSupervisorOO: false, preRegCount: 0 };

            if (isOO && isPreReg) {
                entry.hasPreRegOO = true;
                entry.preRegCount += 1;
            }

            // supervisor = Registered OO present that day
            if (isOO && isRegistered) {
                entry.hasSupervisorOO = true;
            }

            perDay.set(dateKey, entry);
        }

        return Array.from(perDay.entries())
            .filter(([_, v]) => v.hasPreRegOO && !v.hasSupervisorOO)
            .map(([date, v]) => ({ date, preRegCount: v.preRegCount }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [data]);

    return (
        <div className="min-h-screen bg-slate-100">
            <TopBar anchorMonth={anchorMonth} onPrevMonth={onPrevMonth} onNextMonth={onNextMonth} />

            <main className="w-full px-6 py-8">
                {/* ✅ two separate boxes with a visible gap */}
                <div className="flex gap-6 items-start">
                    {/* LEFT SIDEBAR CARD */}
                    <aside className="hidden lg:block w-72 shrink-0">
                        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-slate-900">Needs Supervisor</div>
                                <div className="text-xs font-semibold text-slate-600">
                                    {!loading && !error && data ? needsSupervisorDays.length : "—"}
                                </div>
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                                Pre-Reg OO booked with no supervising Registered OO.
                            </div>

                            <div className="mt-3 space-y-2">
                                {loading && <div className="text-sm text-slate-600">Loading…</div>}
                                {error && <div className="text-sm text-red-600">{error}</div>}

                                {!loading && !error && data && (
                                    <>
                                        {needsSupervisorDays.length === 0 ? (
                                            <div className="text-sm text-slate-600">No flagged days.</div>
                                        ) : (
                                            needsSupervisorDays.map((d) => (
                                                <button
                                                    key={d.date}
                                                    onClick={() => router.push(`/planner/${d.date}`)}
                                                    className="w-full text-left rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-sm font-medium text-slate-900">{d.date}</div>
                                                        <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                                                            {d.preRegCount} pre-reg
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </aside>

                    {/* MAIN MONTH CARD (your existing one, unchanged) */}
                    <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <div className="px-6 pt-5">
                            <ViewTabs />
                        </div>

                        <div className="p-6">
                            {loading && <div className="text-slate-600">Loading…</div>}
                            {error && <div className="text-red-600">{error}</div>}
                            {!loading && !error && data && (
                                <MonthGrid anchorMonth={anchorMonth} data={data} onRefresh={onRefresh} />
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}