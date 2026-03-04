"use client";

import type { Clinician } from "../types/planner";

export default function DayExpectedSidebar({
                                               date,
                                               clinicians,
                                               dayRules,
                                               trainingStart,
                                               rooms,
                                           }: any) {

    const assignedClinicianIds = new Set(
        rooms.flatMap((r: any) =>
            (r.sessions ?? []).map((s: any) => s.clinician_id)
        )
    );

    const expectedOO: any[] = [];
    const expectedCLO: any[] = [];

    for (const r of dayRules ?? []) {
        const clinician = clinicians.find((c: any) => c.id === r.clinician_id);
        if (!clinician) continue;

        if (r.activity_code === "OO") expectedOO.push(clinician);
        if (r.activity_code === "CLO") expectedCLO.push(clinician);
    }

    const missingOO = expectedOO.filter(c => !assignedClinicianIds.has(c.id));
    const missingCLO = expectedCLO.filter(c => !assignedClinicianIds.has(c.id));

    const allAssigned = missingOO.length === 0 && missingCLO.length === 0;

    return (
        <div
            className={`rounded-2xl border p-5 shadow-sm transition
      ${
                allAssigned
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-slate-200"
            }`}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Expected Clinicians
                </div>

                {allAssigned && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600">
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
                )}
            </div>

            <div className="space-y-4">

                <div>
                    <div className="text-xs font-semibold text-slate-600 mb-1">OO</div>

                    {expectedOO.length === 0 ? (
                        <div className="text-sm text-slate-400">None expected</div>
                    ) : (
                        expectedOO.map((c: any) => (
                            <div key={c.id} className="text-sm">
                                {assignedClinicianIds.has(c.id) ? "✓ " : "• "}
                                {c.display_name}
                            </div>
                        ))
                    )}
                </div>

                <div>
                    <div className="text-xs font-semibold text-slate-600 mb-1">CLO</div>

                    {expectedCLO.length === 0 ? (
                        <div className="text-sm text-slate-400">None expected</div>
                    ) : (
                        expectedCLO.map((c: any) => (
                            <div key={c.id} className="text-sm">
                                {assignedClinicianIds.has(c.id) ? "✓ " : "• "}
                                {c.display_name}
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}