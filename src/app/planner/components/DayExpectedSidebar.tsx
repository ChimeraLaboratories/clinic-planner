"use client";

import type { Clinician } from "../types/planner";
import { parseYmdLocal } from "@/app/planner/utils/date";

type DayRuleLike = {
    clinician_id: number | string;
    weekday?: number | string | null; // expected: JS getDay convention (Sun=0..Sat=6)
    uk_day?: number | string | null;
    pattern_code?: string | null; // "EVERY" | "W1" | "W2"
    activity_code?: string | null; // e.g. "GF_DAY"
    // optional extra fields may exist; we keep this loose on purpose
};

function getWeekPattern(date: Date, trainingStart: Date) {
    const diffDays = (date.getTime() - trainingStart.getTime()) / (1000 * 60 * 60 * 24);
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
 * IMPORTANT FIX:
 * Your system uses JS getDay convention: Sun=0..Sat=6.
 * The previous version was "too permissive" (allowed Mon0 + ISO/MySQL),
 * which caused Monday rules to match Tuesday, etc.
 *
 * This is now STRICT:
 * - numeric 0..6 => must equal jsDay
 * - strings "MONDAY"/"TUE" etc => mapped to JS day
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

    // Strict numeric: 0..6 (JS convention ONLY)
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

function tickBadge() {
    return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path
                    d="M16.25 5.75L8.5 13.5L3.75 8.75"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
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
    // Keep this conservative so random "CL" in other codes doesn't misclassify.
    if (a === "CL" || a.startsWith("CL_") || a.includes("CLO")) return "CLO";

    // Otherwise expected in clinic (OO)
    return "OO";
}

function bestRuleForClinician(cid: number, rulesForDay: DayRuleLike[], weekPattern: string): DayRuleLike | null {
    const mine = (rulesForDay ?? []).filter((r) => Number(r?.clinician_id) === cid);

    // prefer W1/W2 over EVERY
    const exact = mine.find((r) => String(r?.pattern_code ?? "").trim().toUpperCase() === weekPattern);
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

    if (!Number.isFinite(date.getTime()) || !Number.isFinite(trainingStart.getTime())) {
        console.log("[ExpectedSidebar] invalid date inputs", { dateISO, trainingStartISO });
        return null;
    }

    const weekPattern = getWeekPattern(date, trainingStart);

    // Filter to ONLY the selected weekday, then to the selected pattern/EVERY.
    const rulesForSelectedWeekday = (dayRules ?? []).filter((r) => weekdayMatchesRule(date, r));
    const rulesForThisDay = rulesForSelectedWeekday.filter((r) => ruleAppliesPattern(r, weekPattern));

    const expectedOOIds = new Set<number>();
    const expectedCLOIds = new Set<number>();

    for (const c of clinicians as any[]) {
        const cid = clinicianIdOf(c);
        if (!Number.isFinite(cid) || cid <= 0) continue;

        const rule = bestRuleForClinician(cid, rulesForThisDay, weekPattern);
        const bucket = classifyActivity(rule?.activity_code);

        // Optional targeted debug (keep/remove as you like)
        if (String((c as any)?.display_name ?? "").toUpperCase().includes("DANI")) {
            console.log("[ExpectedSidebar] Daniyaal picked rule", rule);
        }

        if (bucket === "OO") expectedOOIds.add(cid);
        if (bucket === "CLO") expectedCLOIds.add(cid);
    }

    // IMPORTANT: if clinician lookup fails, still show the ID (don’t go empty)
    const expectedOO = Array.from(expectedOOIds).map((id) => {
        return findClinician(clinicians as any[], id) ?? { id, display_name: `Clinician ${id}` };
    });

    const expectedCLO = Array.from(expectedCLOIds).map((id) => {
        return findClinician(clinicians as any[], id) ?? { id, display_name: `Clinician ${id}` };
    });

    const assignedClinicianIds = extractAssignedClinicianIds(rooms);

    const missingOO = expectedOO.filter((c: any) => !assignedClinicianIds.has(clinicianIdOf(c)));
    const missingCLO = expectedCLO.filter((c: any) => !assignedClinicianIds.has(clinicianIdOf(c)));

    const expectedTotal = expectedOO.length + expectedCLO.length;
    const missingTotal = missingOO.length + missingCLO.length;
    const assignedTotal = expectedTotal - missingTotal;

    const allAssigned = expectedTotal > 0 && assignedTotal === expectedTotal;

    return (
        <div
            className={[
                "w-full rounded-2xl border p-5 shadow-sm",
                allAssigned ? "bg-green-50 border-green-200" : "bg-white border-slate-200",
            ].join(" ")}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Expected Clinicians</div>
                {allAssigned ? tickBadge() : null}
            </div>

            <div className="text-xs text-slate-500 mb-4">
                Week pattern: <span className="font-semibold text-slate-700">{weekPattern}</span>
                {expectedTotal > 0 ? (
                    <>
                        {" "}
                        •{" "}
                        <span className={allAssigned ? "text-green-700 font-semibold" : "text-slate-700 font-semibold"}>
              {assignedTotal}/{expectedTotal} assigned
            </span>
                    </>
                ) : null}
            </div>

            <div className="space-y-4">
                <div>
                    <div className="text-xs font-semibold text-slate-600 mb-1">OO</div>

                    {expectedOO.length === 0 ? (
                        <div className="text-sm text-slate-400">None expected</div>
                    ) : (
                        <div className="space-y-1">
                            {expectedOO.map((c: any) => {
                                const id = clinicianIdOf(c);
                                const isAssigned = assignedClinicianIds.has(id);
                                return (
                                    <div key={`oo-${id}`} className="flex items-center gap-2 text-sm text-slate-800">
                                        <span className={isAssigned ? "text-green-600" : "text-slate-400"}>{isAssigned ? "✓" : "•"}</span>
                                        <span>{clinicianLabel(c)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {missingOO.length > 0 ? (
                        <div className="mt-2 text-xs text-rose-600">Missing: {missingOO.map((c: any) => clinicianLabel(c)).join(", ")}</div>
                    ) : null}
                </div>

                <div>
                    <div className="text-xs font-semibold text-slate-600 mb-1">CLO</div>

                    {expectedCLO.length === 0 ? (
                        <div className="text-sm text-slate-400">None expected</div>
                    ) : (
                        <div className="space-y-1">
                            {expectedCLO.map((c: any) => {
                                const id = clinicianIdOf(c);
                                const isAssigned = assignedClinicianIds.has(id);
                                return (
                                    <div key={`clo-${id}`} className="flex items-center gap-2 text-sm text-slate-800">
                                        <span className={isAssigned ? "text-green-600" : "text-slate-400"}>{isAssigned ? "✓" : "•"}</span>
                                        <span>{clinicianLabel(c)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {missingCLO.length > 0 ? (
                        <div className="mt-2 text-xs text-rose-600">Missing: {missingCLO.map((c: any) => clinicianLabel(c)).join(", ")}</div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}