"use client";

import type { Clinician } from "../types/planner";

// Local shape based on /planner/api/planner dayRules payload
type DayRuleLike = {
    clinician_id: number | string;
    weekday: number; // 0-6 (JS Date)
    pattern_code?: "A" | "B" | "EVERY" | string | null;
    activity_code?: "OO" | "CLO" | string | null;
};

function getWeekPattern(date: Date, trainingStart: Date) {
    const diffDays = (date.getTime() - trainingStart.getTime()) / (1000 * 60 * 60 * 24);
    const weekIndex = Math.floor(diffDays / 7);
    return weekIndex % 2 === 0 ? "A" : "B";
}

function ruleApplies(rule: DayRuleLike, weekPattern: string) {
    const p = String(rule.pattern_code ?? "EVERY").toUpperCase();
    if (!p || p === "EVERY") return true;
    return p === weekPattern;
}

export default function DayExpectedSidebar({
                                               date,
                                               clinicians,
                                               dayRules,
                                               trainingStart,
                                           }: {
    date: Date;
    clinicians: Clinician[];
    dayRules: DayRuleLike[];
    trainingStart: Date;
}) {
    const weekday = date.getDay(); // 0-6
    const weekPattern = getWeekPattern(date, trainingStart);

    const expected = (dayRules ?? []).filter(
        (r) => Number(r.weekday) === weekday && ruleApplies(r, weekPattern)
    );

    const oo: string[] = [];
    const clo: string[] = [];

    for (const rule of expected) {
        const clinician = clinicians.find((c) => Number(c.id) === Number(rule.clinician_id));
        if (!clinician) continue;

        const name = String(clinician.display_name ?? clinician.full_name ?? "").trim();
        if (!name) continue;

        const activity = String(rule.activity_code ?? "").toUpperCase();

        if (activity === "OO") oo.push(name);
        if (activity === "CLO") clo.push(name);
    }

    return (
        <aside className="w-64 border-l bg-gray-50 p-4">
            <div className="text-sm font-semibold text-gray-700 mb-1">Expected</div>
            <div className="text-xs text-gray-500 mb-3">
                Week pattern: <span className="font-semibold text-gray-700">{weekPattern}</span>
            </div>

            <div className="space-y-4">
                <div>
                    <div className="text-xs font-semibold text-gray-500 mb-1">OO</div>
                    {oo.length === 0 ? (
                        <div className="text-sm text-gray-400">None expected</div>
                    ) : (
                        oo.map((name) => (
                            <div key={`oo-${name}`} className="text-sm text-gray-800">
                                {name}
                            </div>
                        ))
                    )}
                </div>

                <div>
                    <div className="text-xs font-semibold text-gray-500 mb-1">CLO</div>
                    {clo.length === 0 ? (
                        <div className="text-sm text-gray-400">None expected</div>
                    ) : (
                        clo.map((name) => (
                            <div key={`clo-${name}`} className="text-sm text-gray-800">
                                {name}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </aside>
    );
}