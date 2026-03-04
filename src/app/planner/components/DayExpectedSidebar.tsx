"use client";

import type { Clinician } from "../types/planner";
import { parseYmdLocal } from "@/app/planner/utils/date";

type DayRuleLike = {
    clinician_id: number | string;
    weekday?: number | string | null; // expected: JS getDay convention (Sun=0..Sat=6)
    uk_day?: number | string | null;
    pattern_code?: string | null; // "EVERY" | "W1" | "W2"
    activity_code?: string | null; // e.g. "GF_DAY"
};

function getWeekPattern(date: Date, trainingStart: Date) {
    const diffDays =
        (date.getTime() - trainingStart.getTime()) / (1000 * 60 * 60 * 24);
    const weekIndex = Math.floor(diffDays / 7);
    return weekIndex % 2 === 0 ? "W1" : "W2";
}

function ruleAppliesPattern(rule: DayRuleLike, weekPattern: string) {
    const p = String(rule?.pattern_code ?? "EVERY").trim().toUpperCase();
    if (!p || p === "EVERY") return true;
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
    const jsDay = date.getDay(); // Sun=0..Sat=6

    const raw =
        rule?.weekday ??
        rule?.uk_day ??
        rule?.day_of_week ??
        rule?.dayOfWeek ??
        rule?.dow;

    const n = Number(raw);

    // Strict numeric: 0..6 only
    if (Number.isFinite(n) && n >= 0 && n <= 6) {
        return n === jsDay;
    }

    // String forms
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

// Your codes: GF_DAY should count as OO expected
function classifyActivity(activityCodeRaw: any): "OO" | "CLO" | null {
    const a = String(activityCodeRaw ?? "").trim().toUpperCase();
    if (!a) return null;

    // Not expected in clinic (per your rules)
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

    // CLO bucket
    if (a === "CL" || a.startsWith("CL_") || a.includes("CLO")) return "CLO";

    // Otherwise expected in clinic (OO)
    return "OO";
}

function bestRuleForClinician(
    cid: number,
    rulesForDay: DayRuleLike[],
    weekPattern: string
): DayRuleLike | null {
    const mine = (rulesForDay ?? []).filter((r) => Number(r?.clinician_id) === cid);

    // prefer W1/W2 over EVERY
    const exact = mine.find(
        (r) => String(r?.pattern_code ?? "").trim().toUpperCase() === weekPattern
    );
    if (exact) return exact;

    const every = mine.find((r) => {
        const p = String(r?.pattern_code ?? "EVERY").trim().toUpperCase();
        return !p || p === "EVERY";
    });

    return every ?? null;
}

export default function DayExpectedSidebar({
                                               dateISO,
                                               clinicians,
                                               dayRules,
                                               trainingStartISO,
                                               rooms,
                                           }: {
    dateISO: string;
    clinicians: Clinician[];
    dayRules: DayRuleLike[];
    trainingStartISO: string;
    rooms: any[];
}) {
    const date = parseYmdLocal(dateISO);
    const trainingStart = parseYmdLocal(trainingStartISO);

    if (
        !Number.isFinite(date.getTime()) ||
        !Number.isFinite(trainingStart.getTime())
    ) {
        console.log("[ExpectedSidebar] invalid date inputs", {
            dateISO,
            trainingStartISO,
        });
        return null;
    }

    const weekPattern = getWeekPattern(date, trainingStart);

    // Assigned clinician ids for THIS day (any session in rooms array)
    const assignedClinicianIds = extractAssignedClinicianIds(rooms);

    // Rules for the selected day + week pattern
    const rulesForSelectedWeekday = (dayRules ?? []).filter((r) =>
        weekdayMatchesRule(date, r)
    );
    const rulesForThisDay = rulesForSelectedWeekday.filter((r) =>
        ruleAppliesPattern(r, weekPattern)
    );

    // Build expected IDs (OO / CLO) from rules
    const expectedOOIds = new Set<number>();
    const expectedCLOIds = new Set<number>();

    for (const c of clinicians as any[]) {
        const cid = clinicianIdOf(c);
        if (!Number.isFinite(cid) || cid <= 0) continue;

        // If already assigned, we DO NOT show them in the sidebar at all
        if (assignedClinicianIds.has(cid)) continue;

        const rule = bestRuleForClinician(cid, rulesForThisDay, weekPattern);
        const bucket = classifyActivity(rule?.activity_code);

        if (bucket === "OO") expectedOOIds.add(cid);
        if (bucket === "CLO") expectedCLOIds.add(cid);
    }

    // Map ids to clinician objects (fallback to ID label)
    const expectedOO = Array.from(expectedOOIds).map((id) => {
        return (
            findClinician(clinicians as any[], id) ?? {
                id,
                display_name: `Clinician ${id}`,
            }
        );
    });

    const expectedCLO = Array.from(expectedCLOIds).map((id) => {
        return (
            findClinician(clinicians as any[], id) ?? {
                id,
                display_name: `Clinician ${id}`,
            }
        );
    });

    const expectedTotal = expectedOO.length + expectedCLO.length;

    return (
        <div className="w-full rounded-2xl border p-5 shadow-sm bg-white border-slate-200">
            <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Expected Clinicians
                </div>
            </div>

            <div className="text-xs text-slate-500 mb-4">
                Week pattern:{" "}
                <span className="font-semibold text-slate-700">{weekPattern}</span>
                {expectedTotal > 0 ? (
                    <>
                        {" "}
                        •{" "}
                        <span className="text-slate-700 font-semibold">
              {expectedTotal} remaining
            </span>
                    </>
                ) : (
                    <>
                        {" "}
                        •{" "}
                        <span className="text-slate-700 font-semibold">None remaining</span>
                    </>
                )}
            </div>

            <div className="space-y-4">
                <div>
                    <div className="text-xs font-semibold text-slate-600 mb-1">ST</div>

                    {expectedOO.length === 0 ? (
                        <div className="text-sm text-slate-400">None remaining</div>
                    ) : (
                        <div className="space-y-1">
                            {expectedOO.map((c: any) => {
                                const id = clinicianIdOf(c);
                                return (
                                    <div
                                        key={`oo-${id}`}
                                        className="flex items-center gap-2 text-sm text-slate-800"
                                    >
                                        <span className="text-slate-400">•</span>
                                        <span>{clinicianLabel(c)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div>
                    <div className="text-xs font-semibold text-slate-600 mb-1">CL</div>

                    {expectedCLO.length === 0 ? (
                        <div className="text-sm text-slate-400">None remaining</div>
                    ) : (
                        <div className="space-y-1">
                            {expectedCLO.map((c: any) => {
                                const id = clinicianIdOf(c);
                                return (
                                    <div
                                        key={`clo-${id}`}
                                        className="flex items-center gap-2 text-sm text-slate-800"
                                    >
                                        <span className="text-slate-400">•</span>
                                        <span>{clinicianLabel(c)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}