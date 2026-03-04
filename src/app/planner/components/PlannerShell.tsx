"use client";

import type { PlannerResponse } from "../types/planner";
import TopBar from "./TopBar";
import ViewTabs, { type PlannerTab } from "./ViewTabs";
import MonthGrid from "./MonthGrid";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import HolidayBookedView from "@/app/planner/components/HolidayBookedView";

/**
 * IMPORTANT FIX:
 * Your "Days Requiring Supervisors" was still showing even after setting Supervisor in Store.
 * That means either:
 *  - the API is returning supervisorsInStore under a different date format, OR
 *  - some rows still have needsSupervisor = true and your UI trusts it, OR
 *  - the date string includes time/extra text.
 *
 * This rewrite:
 *  ✅ normalizes ALL supervisionByDate row dates to "YYYY-MM-DD" safely
 *  ✅ computes "needs supervisor" ONLY when:
 *       preRegCount > 0 AND supervisorsInClinic+supervisorsInStore are BOTH empty
 *  ✅ provides robust fallback to derive missing dates
 *  ✅ adds a small debug dump you can keep/remove
 */

function normalizeYmd(input: any): string | null {
    if (!input) return null;

    // already in YYYY-MM-DD
    if (typeof input === "string") {
        const s = input.trim();

        // common: "2026-04-07T00:00:00.000Z" or "2026-04-07 00:00:00"
        const mIso = s.match(/^(\d{4}-\d{2}-\d{2})/);
        if (mIso) return mIso[1];

        // handle "07/04/2026" (UK) or "04/07/2026" (US) – we avoid guessing.
        // If backend accidentally sends dd/mm/yyyy, we cannot infer reliably.
        // We return null so it doesn't poison keys.
        return null;
    }

    // Date instance
    if (input instanceof Date && !isNaN(input.getTime())) {
        const yyyy = input.getFullYear();
        const mm = String(input.getMonth() + 1).padStart(2, "0");
        const dd = String(input.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    return null;
}

function getSessionDateKey(s: any): string | null {
    const v = s?.session_date ?? s?.date ?? s?.sessionDate ?? null;
    if (!v) return null;

    if (typeof v === "string") {
        // prefer parsing as Date only if it works, but normalize to YYYY-MM-DD
        const d = new Date(v);
        if (!isNaN(d.getTime())) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            return `${yyyy}-${mm}-${dd}`;
        }
        const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
        return m ? m[1] : null;
    }

    if (v instanceof Date && !isNaN(v.getTime())) {
        const yyyy = v.getFullYear();
        const mm = String(v.getMonth() + 1).padStart(2, "0");
        const dd = String(v.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    return null;
}

function getSessionSTValue(s: any): number {
    const code = String(s?.session_type ?? s?.type ?? s?.clinic_code ?? "")
        .trim()
        .toUpperCase();

    if (!code.startsWith("ST")) return 0;

    const rawValue = s?.st_value ?? s?.value ?? s?.clinic_value ?? 0;
    const n = Number(rawValue);
    return Number.isFinite(n) ? n : 0;
}

function getSessionClinicCode(s: any): string {
    return String(s?.session_type ?? s?.type ?? s?.clinic_code ?? s?.clinicCode ?? "")
        .trim()
        .toUpperCase();
}

function isSTClinic(s: any): boolean {
    const code = getSessionClinicCode(s);
    return code === "ST" || code.startsWith("ST");
}

type NeedsSupervisorDay = {
    date: string; // YYYY-MM-DD
    preRegCount: number;
    supervisorCount: number;
    preRegs: string;
    supervisorsInClinic: string;
    supervisorsInStore: string;
};

type StoreSupervisorDay = {
    date: string; // YYYY-MM-DD
    supervisorsInStore: string;
};

export default function PlannerShell({
                                         anchorMonth,
                                         onPrevMonth,
                                         onNextMonth,
                                         onSetMonth,
                                         data,
                                         loading,
                                         error,
                                         onRefresh,
                                     }: {
    anchorMonth: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onSetMonth: (d: Date) => void;
    data: PlannerResponse | null;
    loading: boolean;
    error: string | null;
    onRefresh: () => void | Promise<void>;
}) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<PlannerTab>("month");

    useEffect(() => {
        setActiveTab("month");
    }, [anchorMonth]);

    const ooClinicianId = useMemo(() => {
        const list = (data?.clinicians ?? []) as any[];
        const oo = list.find((c) => {
            const dn = String(c?.display_name ?? "").trim().toUpperCase();
            const fn = String(c?.full_name ?? "").trim().toUpperCase();
            return dn === "OO" || fn === "OO";
        });
        const n = Number(oo?.id ?? null);
        return Number.isFinite(n) ? n : null;
    }, [data?.clinicians]);

    function ymd(d: Date) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    function monthStart(d: Date) {
        return new Date(d.getFullYear(), d.getMonth(), 1);
    }

    function monthEnd(d: Date) {
        return new Date(d.getFullYear(), d.getMonth() + 1, 0);
    }

    /**
     * Normalize supervisionByDate rows into a safe, reliable map keyed by YYYY-MM-DD.
     * If backend returns "2026-04-07T..." this will still key correctly.
     */
    const supervisionByDateMap = useMemo(() => {
        const rows: any[] = (data as any)?.supervisionByDate ?? [];
        const map = new Map<string, any>();

        for (const r of rows) {
            const key = normalizeYmd(r?.date);
            if (!key) continue;
            // last write wins; OK for this use case
            map.set(key, r);
        }

        return map;
    }, [data]);

    // Keep your April debug but make it actually show if the API date keys are weird
    useEffect(() => {
        const sessions = (data?.sessions ?? []) as any[];
        const uniqueDates = Array.from(new Set(sessions.map(getSessionDateKey).filter(Boolean))).sort();
        console.log("[debug] unique session date keys (month fetch)", uniqueDates);

        const rows: any[] = (data as any)?.supervisionByDate ?? [];
        const uniqueSupDates = Array.from(
            new Set(rows.map((r) => normalizeYmd(r?.date)).filter(Boolean))
        ).sort();
        console.log("[debug] unique supervisionByDate keys (normalized)", uniqueSupDates);

        // Watch the Tuesdays you mentioned (April 2026)
        const watch = ["2026-04-07", "2026-04-14", "2026-04-21", "2026-04-28"];
        console.log(
            "[debug] watched supervision rows",
            watch.map((k) => ({ k, row: supervisionByDateMap.get(k) ?? null }))
        );
    }, [data, supervisionByDateMap]);

    /**
     * ✅ REAL SOURCE OF TRUTH (frontend):
     * We compute "needs supervisor" ourselves from the row content, not from r.needsSupervisor.
     * A day needs supervision ONLY if:
     *   - preRegCount > 0
     *   - AND supervisorsInClinic is empty
     *   - AND supervisorsInStore is empty
     *
     * This guarantees that setting Supervisor In Store removes the day.
     */
    const needsSupervisorDays = useMemo<NeedsSupervisorDay[]>(() => {
        const out: NeedsSupervisorDay[] = [];

        for (const [date, r] of supervisionByDateMap.entries()) {
            const preRegCount = Number(r?.preRegCount ?? 0);

            const clinic = String(r?.supervisorsInClinic ?? "").trim();
            const store = String(r?.supervisorsInStore ?? "").trim();

            const hasSupervisor = clinic.length > 0 || store.length > 0;
            if (preRegCount > 0 && !hasSupervisor) {
                out.push({
                    date,
                    preRegCount,
                    supervisorCount: Number(r?.supervisorCount ?? 0),
                    preRegs: String(r?.preRegs ?? ""),
                    supervisorsInClinic: clinic,
                    supervisorsInStore: store,
                });
            }
        }

        return out.sort((a, b) => a.date.localeCompare(b.date));
    }, [supervisionByDateMap]);

    // ✅ Show who is "Supervisor in store" even if not in clinic
    const supervisorInStoreOnlyDays = useMemo<StoreSupervisorDay[]>(() => {
        const out: StoreSupervisorDay[] = [];

        for (const [date, r] of supervisionByDateMap.entries()) {
            const store = String(r?.supervisorsInStore ?? "").trim();
            const clinic = String(r?.supervisorsInClinic ?? "").trim();
            if (store.length > 0 && clinic.length === 0) {
                out.push({ date, supervisorsInStore: store });
            }
        }

        return out.sort((a, b) => a.date.localeCompare(b.date));
    }, [supervisionByDateMap]);

    // ✅ Days where Total ST Value is low (includes days with 0)
    const lowSTValueDays = useMemo(() => {
        if (!data) return [];

        const perDay = new Map<string, number>();

        for (const s of (data.sessions ?? []) as any[]) {
            const dateKey = getSessionDateKey(s);
            if (!dateKey) continue;
            if (!isSTClinic(s)) continue;

            const stVal = getSessionSTValue(s);
            perDay.set(dateKey, (perDay.get(dateKey) ?? 0) + stVal);
        }

        const start = monthStart(anchorMonth);
        const end = monthEnd(anchorMonth);

        const out: { date: string; totalST: number; status: "critical" | "warning" | "ok" }[] = [];

        const cur = new Date(start);
        while (cur <= end) {
            const key = ymd(cur);
            const totalST = perDay.get(key) ?? 0;

            out.push({
                date: key,
                totalST,
                status: totalST <= 5 ? "critical" : totalST > 5 && totalST < 6 ? "warning" : "ok",
            });

            cur.setDate(cur.getDate() + 1);
        }

        return out.filter((d) => d.status !== "ok").sort((a, b) => a.date.localeCompare(b.date));
    }, [data, anchorMonth]);

    const stCardStatus =
        lowSTValueDays.some((d) => d.status === "critical")
            ? "critical"
            : lowSTValueDays.length > 0
                ? "warning"
                : "ok";

    function handleCurrentMonth() {
        const now = new Date();
        onSetMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    }

    return (
        <div className="min-h-screen bg-slate-100">
            <TopBar
                anchorMonth={anchorMonth}
                onPrevMonth={onPrevMonth}
                onNextMonth={onNextMonth}
                onCurrentMonth={handleCurrentMonth}
                clinicians={data?.clinicians ?? []}
                onRefresh={onRefresh}
            />

            <main className="w-full px-6 py-8">
                <div className="flex gap-6 items-start">
                    {/* LEFT SIDEBAR CARDS */}
                    <aside className="hidden lg:block w-80 shrink-0">
                        <div className="space-y-6">
                            {/* NEEDS SUPERVISOR CARD */}
                            <div
                                className={`rounded-2xl border shadow-sm p-6 transition-all ${
                                    needsSupervisorDays.length > 0
                                        ? "bg-red-50 border-red-200"
                                        : "bg-emerald-50 border-emerald-200"
                                }`}
                            >
                                <div className="text-xs font-semibold tracking-wide uppercase text-slate-600">
                                    Days Requiring Supervisors
                                </div>

                                <div className="mt-3 flex items-center gap-3">
                                    <div
                                        className={`text-4xl font-bold leading-none ${
                                            needsSupervisorDays.length > 0 ? "text-red-600" : "text-emerald-600"
                                        }`}
                                    >
                                        {needsSupervisorDays.length}
                                    </div>

                                    {needsSupervisorDays.length > 0 ? (
                                        <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
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

                                <div className="mt-3 text-sm text-slate-700">
                                    {needsSupervisorDays.length > 0
                                        ? "Pre-Reg OO scheduled without a supervising Registered OO (clinic OR in-store)."
                                        : "All clinics properly supervised."}
                                </div>

                                {needsSupervisorDays.length > 0 && (
                                    <div className="mt-5 space-y-3">
                                        {needsSupervisorDays.map((d) => (
                                            <button
                                                key={d.date}
                                                onClick={() => router.push(`/planner/${d.date}`)}
                                                className="w-full text-left rounded-xl border border-red-200 bg-white px-4 py-3 hover:bg-red-50 transition"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-semibold text-slate-900">{d.date}</div>
                                                        <div className="mt-1 text-xs text-slate-500">{d.preRegs}</div>

                                                        {/* For "needs supervisor" days, there should be no supervisors.
                                Keep this hidden to avoid confusion. */}
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

                            {/* (Optional) Supervisor in store-only card (kept hidden unless you want it)
                  You can uncomment if useful for debugging.
              */}
                            {/*
              <div className="rounded-2xl border shadow-sm p-6 bg-slate-50 border-slate-200">
                <div className="text-xs font-semibold tracking-wide uppercase text-slate-600">
                  Supervisor in Store (not in clinic)
                </div>
                <div className="mt-3 text-4xl font-bold leading-none text-slate-800">
                  {supervisorInStoreOnlyDays.length}
                </div>
                {supervisorInStoreOnlyDays.length > 0 && (
                  <div className="mt-5 space-y-3">
                    {supervisorInStoreOnlyDays.map((d) => (
                      <button
                        key={d.date}
                        onClick={() => router.push(`/planner/${d.date}`)}
                        className="w-full text-left rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-100 transition"
                      >
                        <div className="text-sm font-semibold text-slate-900">{d.date}</div>
                        <div className="mt-1 text-xs text-slate-600">{d.supervisorsInStore}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              */}

                            {/* CLINICS (ST VALUE) CARD */}
                            <div
                                className={`rounded-2xl border shadow-sm p-6 transition-all ${
                                    stCardStatus === "critical"
                                        ? "bg-red-50 border-red-200"
                                        : stCardStatus === "warning"
                                            ? "bg-orange-50 border-orange-200"
                                            : "bg-emerald-50 border-emerald-200"
                                }`}
                            >
                                <div className="text-xs font-semibold tracking-wide uppercase text-slate-600">
                                    Days with Low ST Value
                                </div>

                                <div className="mt-3 flex items-center gap-3">
                                    <div
                                        className={`text-4xl font-bold leading-none ${
                                            stCardStatus === "critical"
                                                ? "text-red-600"
                                                : stCardStatus === "warning"
                                                    ? "text-orange-700"
                                                    : "text-emerald-600"
                                        }`}
                                    >
                                        {lowSTValueDays.length}
                                    </div>

                                    {stCardStatus === "critical" ? (
                                        <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                    </span>
                                    ) : stCardStatus === "warning" ? (
                                        <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-600" />
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

                                <div className="mt-3 text-sm text-slate-700">
                                    {stCardStatus === "critical"
                                        ? "Some days have Total ST Value below 6."
                                        : stCardStatus === "warning"
                                            ? "Some days have Total ST Value at 6."
                                            : "All days meet ST value target."}
                                </div>

                                {lowSTValueDays.length > 0 && (
                                    <div className="mt-5 space-y-3">
                                        {lowSTValueDays.map((d) => (
                                            <button
                                                key={d.date}
                                                onClick={() => router.push(`/planner/${d.date}`)}
                                                className={`w-full text-left rounded-xl border bg-white px-4 py-3 transition ${
                                                    d.status === "critical"
                                                        ? "border-red-200 hover:bg-red-50"
                                                        : "border-orange-200 hover:bg-orange-50"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-900">{d.date}</div>
                                                        <div className="mt-1 text-xs text-slate-500">
                                                            Total ST Value: {d.totalST.toFixed(2)}
                                                        </div>
                                                    </div>

                                                    <div
                                                        className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                                                            d.status === "critical"
                                                                ? "text-red-700 bg-red-100"
                                                                : "text-orange-800 bg-orange-100"
                                                        }`}
                                                    >
                                                        {d.status === "critical" ? "Attention" : "Warning"}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>

                    {/* MAIN CARD */}
                    <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <div className="px-6 pt-5">
                            <ViewTabs value={activeTab} onChange={setActiveTab} />
                        </div>

                        <div className="p-6">
                            {loading && <div className="text-slate-600">Loading…</div>}
                            {error && <div className="text-red-600">{error}</div>}

                            {!loading && !error && data && activeTab === "month" && (
                                <MonthGrid anchorMonth={anchorMonth} data={data} onRefresh={onRefresh} />
                            )}

                            {!loading && !error && data && activeTab === "holidays" && (
                                <HolidayBookedView anchorMonth={anchorMonth} data={data} ooClinicianId={ooClinicianId} />
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}