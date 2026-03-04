"use client";

import type { Clinician } from "../types/planner";
import { parseYmdLocal } from "@/app/planner/utils/date";
import { getWeekPatternFromYmd } from "@/lib/WeekPattern";

type DayRuleLike = {
    clinician_id: number | string;
    weekday?: number | string | null; // JS getDay (Sun=0..Sat=6)
    uk_day?: number | string | null;
    pattern_code?: string | null; // "W1" | "W2"
    activity_code?: string | null;
};

type HolidayLike = {
    clinician_id: number | string;
    date: string; // "YYYY-MM-DD"
};

function ruleAppliesPattern(rule: DayRuleLike, weekPattern: string) {
    const p = String(rule?.pattern_code ?? "").trim().toUpperCase();
    return p === weekPattern;
}

function clinicianIdOf(c: any): number {
    const n = Number(c?.id ?? c?.clinician_id ?? c?.clinicianId);
    return Number.isFinite(n) ? n : NaN;
}

function findClinician(clinicians: any[], id: number) {
    return clinicians.find((c) => clinicianIdOf(c) === id) ?? null;
}

/**
 * STRICT JS getDay matching (Sun=0..Sat=6)
 */
function weekdayMatchesRule(date: Date, rule: any): boolean {
    const jsDay = date.getDay();
    const raw =
        rule?.weekday ??
        rule?.uk_day ??
        rule?.day_of_week ??
        rule?.dayOfWeek ??
        rule?.dow;

    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0 && n <= 6) return n === jsDay;

    const s = String(raw ?? "").trim().toUpperCase();
    const mapJS: Record<string, number> = {
        SUN: 0,
        SUNDAY: 0,
        MON: 1,
        MONDAY: 1,
        TUE: 2,
        TUESDAY: 2,
        WED: 3,
        WEDNESDAY: 3,
        THU: 4,
        THURSDAY: 4,
        FRI: 5,
        FRIDAY: 5,
        SAT: 6,
        SATURDAY: 6,
    };

    const d = mapJS[s];
    return d !== undefined && d === jsDay;
}

function extractAssignedClinicianIds(rooms: any[]): Set<number> {
    const ids = new Set<number>();

    for (const r of rooms ?? []) {
        const sessions: any[] = Array.isArray((r as any).sessions)
            ? (r as any).sessions
            : Array.isArray((r as any).Sessions)
                ? (r as any).Sessions
                : [];

        for (const s of sessions) {
            const cid = Number((s as any)?.clinician_id ?? (s as any)?.clinicianId);
            if (Number.isFinite(cid) && cid > 0) ids.add(cid);
        }
    }

    return ids;
}

function clinicianLabel(c: any) {
    const name = String(c?.display_name ?? c?.full_name ?? "").trim();
    if (name) return name;

    const id = clinicianIdOf(c);
    return Number.isFinite(id) ? `Clinician ${id}` : "Clinician";
}

function classifyActivity(activityCodeRaw: any): "OO" | "CLO" | null {
    const a = String(activityCodeRaw ?? "").trim().toUpperCase();
    if (!a) return null;

    const notWorking = new Set([
        "D/O",
        "DO",
        "DAY OFF",
        "DAY_OFF",
        "OFF",
        "HOL",
        "HOLIDAY",
        "AL",
        "ANNUAL_LEAVE",
        "SICK",
        "SL",
        "SG",
        "ADMIN",
        "SF",
    ]);

    if (notWorking.has(a)) return null;

    if (a === "CL" || a.startsWith("CL_") || a.includes("CLO")) return "CLO";

    return "OO";
}

function isGroundFloorActivity(activityCodeRaw: any): boolean {
    const a = String(activityCodeRaw ?? "").trim().toUpperCase();
    if (!a) return false;
    return a === "GF" || a === "GF_DAY" || a.startsWith("GF_");
}

function bestRuleForClinician(
    cid: number,
    rulesForDay: DayRuleLike[],
    weekPattern: string
): DayRuleLike | null {
    const mine = (rulesForDay ?? []).filter((r) => Number(r?.clinician_id) === cid);

    const exact = mine.find(
        (r) => String(r?.pattern_code ?? "").trim().toUpperCase() === weekPattern
    );
    if (exact) return exact;

    // (kept as-is: your rules currently only use W1/W2)
    const every = mine.find((r) => {
        const p = String(r?.pattern_code ?? "").trim().toUpperCase();
        return p === weekPattern;
    });

    return every ?? null;
}

function StatusDot({ status }: { status: "ok" | "warning" | "critical" }) {
    if (status === "critical") {
        return (
            <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 dark:bg-red-500/30" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
        );
    }
    if (status === "warning") {
        return (
            <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-60 dark:bg-orange-500/25" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-600" />
            </span>
        );
    }
    return (
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
    );
}

function holidayIdsForDate(
    holidays: HolidayLike[] | undefined,
    dateISO: string
): Set<number> {
    const ids = new Set<number>();
    const key = String(dateISO).slice(0, 10);

    for (const h of holidays ?? []) {
        const d = String((h as any)?.date ?? "").slice(0, 10);
        if (d !== key) continue;

        const cid = Number((h as any)?.clinician_id ?? (h as any)?.clinicianId);
        if (Number.isFinite(cid) && cid > 0) ids.add(cid);
    }

    return ids;
}

export default function DayExpectedSidebar({
                                               dateISO,
                                               clinicians,
                                               dayRules,
                                               rooms,
                                               holidays,
                                           }: {
    dateISO: string;
    clinicians: Clinician[];
    dayRules: DayRuleLike[];
    rooms: any[];
    holidays?: HolidayLike[];
}) {
    const date = parseYmdLocal(dateISO);
    if (!Number.isFinite(date.getTime())) {
        console.log("[DayExpectedSidebar] invalid date input", { dateISO });
        return null;
    }

    const weekPattern = getWeekPatternFromYmd(String(dateISO).slice(0, 10));

    const assignedClinicianIds = extractAssignedClinicianIds(rooms);
    const holidayClinicianIds = holidayIdsForDate(holidays, dateISO);

    const rulesForSelectedWeekday = (dayRules ?? []).filter((r) =>
        weekdayMatchesRule(date, r)
    );
    const rulesForThisDay = rulesForSelectedWeekday.filter((r) =>
        ruleAppliesPattern(r, weekPattern)
    );

    const remainingOOIds = new Set<number>();
    const remainingCLOIds = new Set<number>();
    const groundFloorById = new Map<number, boolean>();

    for (const c of clinicians as any[]) {
        const cid = clinicianIdOf(c);
        if (!Number.isFinite(cid) || cid <= 0) continue;

        if (holidayClinicianIds.has(cid)) continue;
        if (assignedClinicianIds.has(cid)) continue;

        const rule = bestRuleForClinician(cid, rulesForThisDay, weekPattern);

        if (isGroundFloorActivity(rule?.activity_code)) {
            groundFloorById.set(cid, true);
        }

        const bucket = classifyActivity(rule?.activity_code);
        if (bucket === "OO") remainingOOIds.add(cid);
        if (bucket === "CLO") remainingCLOIds.add(cid);
    }

    const remainingOO = Array.from(remainingOOIds).map((id) => {
        return (
            findClinician(clinicians as any[], id) ?? { id, display_name: `Clinician ${id}` }
        );
    });

    const remainingCLO = Array.from(remainingCLOIds).map((id) => {
        return (
            findClinician(clinicians as any[], id) ?? { id, display_name: `Clinician ${id}` }
        );
    });

    const remainingTotal = remainingOO.length + remainingCLO.length;

    const status: "ok" | "warning" | "critical" =
        remainingTotal === 0 ? "ok" : remainingTotal <= 2 ? "warning" : "critical";

    // ✅ Match PlannerShell colour system (light + dark variants)
    const cardClass =
        status === "critical"
            ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/60"
            : status === "warning"
                ? "bg-orange-50 border-orange-200 dark:bg-orange-950/25 dark:border-orange-900/60"
                : "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/25 dark:border-emerald-900/60";

    const countClass =
        status === "critical"
            ? "text-red-600 dark:text-red-300"
            : status === "warning"
                ? "text-orange-700 dark:text-orange-300"
                : "text-emerald-600 dark:text-emerald-300";

    const subtitle =
        status === "ok"
            ? "All expected clinicians are assigned."
            : status === "warning"
                ? "A small number of expected clinicians remain unassigned."
                : "Expected clinicians remain unassigned for today.";

    const renderClinicianLine = (c: any) => {
        const id = clinicianIdOf(c);
        const gf = Number.isFinite(id) ? groundFloorById.get(id) === true : false;

        return (
            <span className="flex min-w-0 items-center gap-2">
                <span className="truncate">{clinicianLabel(c)}</span>

                {gf && (
                    <span className="shrink-0 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200 text-[11px] font-semibold px-2 py-0.5">
                        Ground Floor
                    </span>
                )}
            </span>
        );
    };

    const Panel = ({
                       title,
                       state,
                       children,
                   }: {
        title: string;
        state: "Remaining" | "Complete";
        children: React.ReactNode;
    }) => {
        const pill =
            state === "Remaining"
                ? "text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-950/40"
                : "text-emerald-700 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-950/40";

        return (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold tracking-wide text-slate-900 dark:text-slate-100">
                        {title}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pill}`}>
                        {state}
                    </span>
                </div>

                <div className="mt-2">{children}</div>
            </div>
        );
    };

    return (
        <div className={`rounded-2xl border shadow-sm dark:shadow-none p-6 transition-all ${cardClass}`}>
            <div className="text-xs font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-300">
                Expected Clinicians Remaining
            </div>

            <div className="mt-3 flex items-center gap-3">
                <div className={`text-4xl font-bold leading-none ${countClass}`}>
                    {remainingTotal}
                </div>
                <StatusDot status={status} />
            </div>

            <div className="mt-3 text-sm text-slate-700 dark:text-slate-200">
                {subtitle}{" "}
                <span className="text-slate-500 dark:text-slate-400">
                    (Pattern:{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {weekPattern}
                    </span>
                    )
                </span>
            </div>

            {remainingTotal > 0 && (
                <div className="mt-5 space-y-3">
                    <Panel title="OO" state={remainingOO.length > 0 ? "Remaining" : "Complete"}>
                        {remainingOO.length === 0 ? (
                            <div className="text-sm text-slate-600 dark:text-slate-400">None remaining</div>
                        ) : (
                            <ul className="space-y-1 text-sm text-slate-900 dark:text-slate-100">
                                {remainingOO.map((c: any) => {
                                    const id = clinicianIdOf(c);
                                    return (
                                        <li key={`oo-${id}`} className="flex gap-2 min-w-0">
                                            <span className="text-slate-400 dark:text-slate-500">•</span>
                                            <span className="min-w-0">{renderClinicianLine(c)}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Panel>

                    <Panel title="CLO" state={remainingCLO.length > 0 ? "Remaining" : "Complete"}>
                        {remainingCLO.length === 0 ? (
                            <div className="text-sm text-slate-600 dark:text-slate-400">None remaining</div>
                        ) : (
                            <ul className="space-y-1 text-sm text-slate-900 dark:text-slate-100">
                                {remainingCLO.map((c: any) => {
                                    const id = clinicianIdOf(c);
                                    return (
                                        <li key={`clo-${id}`} className="flex gap-2 min-w-0">
                                            <span className="text-slate-400 dark:text-slate-500">•</span>
                                            <span className="min-w-0">{renderClinicianLine(c)}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Panel>
                </div>
            )}
        </div>
    );
}