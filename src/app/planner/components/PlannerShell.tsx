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
    const raw =
        s?.clinician_id ??
        s?.clinicianId ??
        s?.clinician?.id ??        // 👈 if session embeds clinician object
        s?.clinician_id_fk ??      // 👈 if you used a different column
        null;

    if (raw === null || raw === undefined || raw === "") return null;

    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
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
        for (const c of (data.clinicians ?? []) as any[]) clinicianById.set(Number(c.id), c);

        const perDay = new Map<string, { preRegs: string[]; supervisors: string[] }>();

        for (const s of (data.sessions ?? []) as any[]) {
            const dateKey = String(s?.session_date ?? s?.date ?? "").slice(0, 10);
            if (!dateKey) continue;

            const cid = Number(s?.clinician_id ?? s?.clinicianId);
            if (!Number.isFinite(cid)) continue;

            const c = clinicianById.get(cid);
            if (!c) continue;

            const role = Number(c.role_code);   // OO=1
            const grade = Number(c.grade_code); // Registered=1, PreReg=2
            const name = String(c.display_name ?? c.full_name ?? `#${cid}`);

            const isPreRegOO = role === 1 && grade === 2;

            // ✅ Supervisor anywhere in the day (OO registered only)
            const isSupervisor = role === 1 && grade === 1 && Number(c.is_supervisor) === 1;

            const entry = perDay.get(dateKey) ?? { preRegs: [], supervisors: [] };
            if (isPreRegOO) entry.preRegs.push(name);
            if (isSupervisor) entry.supervisors.push(name);
            perDay.set(dateKey, entry);
        }

        //DEBUG DATA
        //SHOW KEYS AND SUPERVISORS
        if (data) {
            console.log("[DEBUG] clinician sample keys", Object.keys(data.clinicians?.[0] ?? {}));
            console.log("[DEBUG] supervisors in payload", (data.clinicians ?? []).filter((c: any) => Number(c.is_supervisor) === 1).length);
        }
        //DEBUG TABLE SHOWING PRE-REG AND SUPERVISORS
       const debug = Array.from(perDay.entries())
            .map(([date, v]) => ({
                date,
                preRegCount: v.preRegs.length,
                supervisorCount: v.supervisors.length,
                preRegs: v.preRegs.join(", "),
                supervisors: v.supervisors.join(", "),
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        console.table(debug.filter(r => r.date === "2026-03-01" || r.date === "2026-03-02"));

        return Array.from(perDay.entries())
            .map(([date, v]) => ({
                date,
                preRegCount: v.preRegs.length,
                supervisorCount: v.supervisors.length,
                preRegs: v.preRegs.join(", "),
            }))
            .filter((r) => r.preRegCount > 0 && r.supervisorCount === 0)
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [data?.sessions, data?.clinicians]);

    return (
        <div className="min-h-screen bg-slate-100">
            <TopBar anchorMonth={anchorMonth} onPrevMonth={onPrevMonth} onNextMonth={onNextMonth} />

            <main className="w-full px-6 py-8">
                {/* ✅ two separate boxes with a visible gap */}
                <div className="flex gap-6 items-start">
                    {/* LEFT SIDEBAR CARD */}
                    <aside className="hidden lg:block w-80 shrink-0">
                        <div
                            className={`rounded-2xl border shadow-sm p-6 transition-all ${
                                needsSupervisorDays.length > 0
                                    ? "bg-red-50 border-red-200"
                                    : "bg-emerald-50 border-emerald-200"
                            }`}
                        >
                            {/* HEADER */}
                            <div className="text-xs font-semibold tracking-wide uppercase text-slate-600">
                                Needs Supervisor
                            </div>

                            {/* STATUS NUMBER + DOT */}
                            <div className="mt-3 flex items-center gap-3">
                                <div
                                    className={`text-4xl font-bold leading-none ${
                                        needsSupervisorDays.length > 0
                                            ? "text-red-600"
                                            : "text-emerald-600"
                                    }`}
                                >
                                    {needsSupervisorDays.length}
                                </div>

                                {needsSupervisorDays.length > 0 ? (
                                    <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
                                ) : (
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600">
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path
                d="M16.25 5.75L8.5 13.5L3.75 8.75"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
          </svg>
        </span>
                                )}
                            </div>

                            {/* DESCRIPTION */}
                            <div className="mt-3 text-sm text-slate-700">
                                {needsSupervisorDays.length > 0
                                    ? "Pre-Reg OO scheduled without a supervising Registered OO."
                                    : "All clinics properly supervised."}
                            </div>

                            {/* FLAGGED DAYS */}
                            {needsSupervisorDays.length > 0 && (
                                <div className="mt-5 space-y-3">
                                    {needsSupervisorDays.map((d) => (
                                        <button
                                            key={d.date}
                                            onClick={() => router.push(`/planner/${d.date}`)}
                                            className="w-full text-left rounded-xl border border-red-200 bg-white px-4 py-3 hover:bg-red-50 transition"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        {d.date}
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {d.preRegs}
                                                    </div>
                                                </div>

                                                <div className="text-xs font-semibold text-red-700 bg-red-100 rounded-full px-2 py-0.5">
                                                    Attention
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
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