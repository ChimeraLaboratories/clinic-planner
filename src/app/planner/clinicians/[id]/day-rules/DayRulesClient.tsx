"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClinicianTemplateHeader } from "./components/ClinicianTemplateHeader";
import { WeeklySummary } from "./components/WeeklySummary";
import { DayRulesTable } from "./components/DayRulesTable";
import { LiveAllocationPreview } from "./components/LiveAllocationPreview";
import type { Clinician, DayRuleRow, Pattern, PreviewRow } from "./components/types";

function isoToday() {
    return new Date().toISOString().slice(0, 10);
}

function normalizeWeekly(rows: DayRuleRow[], pattern: Pattern): DayRuleRow[] {
    const byDay = new Map<number, DayRuleRow>();
    rows.forEach((r) => byDay.set(Number(r.weekday), r));

    return [1, 2, 3, 4, 5, 6, 0].map((weekday) => {
        const r = byDay.get(weekday);
        return {
            id: r?.id ?? null,
            weekday,
            activity_code: r?.activity_code ?? "UNSET",
            start_time: r?.start_time ?? null,
            end_time: r?.end_time ?? null,
            note: r?.note ?? null,
            effective_from: r?.effective_from ?? null,
            effective_to: r?.effective_to ?? null,
            pattern_code: r?.pattern_code ?? pattern,
        };
    });
}

export default function DayRulesClient({ clinician }: { clinician: Clinician }) {
    const [pattern, setPattern] = useState<Pattern>("W1");
    const [date, setDate] = useState(isoToday());
    const [weekly, setWeekly] = useState<DayRuleRow[]>([]);
    const [preview, setPreview] = useState<PreviewRow[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);

        try {
            const rulesRes = await fetch(
                `/planner/api/clinicians/${clinician.id}/day-rules?date=${date}&pattern=${pattern}`,
                { cache: "no-store" }
            );

            if (!rulesRes.ok) throw new Error("Failed to load day rules");

            const rulesJson = await rulesRes.json();
            setWeekly(normalizeWeekly(rulesJson.weekly ?? [], pattern));

            const previewRes = await fetch(
                `/planner/api/clinicians/${clinician.id}/day-rules/allocations?date=${date}&pattern=${pattern}`,
                { cache: "no-store" }
            );

            if (previewRes.ok) {
                const previewJson = await previewRes.json();
                setPreview(previewJson.previews ?? []);
            }

            setLastUpdated(
                new Date().toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                })
            );
        } catch (e: any) {
            setError(e?.message ?? "Failed to load");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [pattern, date]);

    function updateRule(weekday: number, patch: Partial<DayRuleRow>) {
        setWeekly((prev) =>
            prev.map((row) => {
                if (row.weekday !== weekday) return row;

                const next = { ...row, ...patch };

                if (patch.activity_code === "D/O") {
                    next.start_time = null;
                    next.end_time = null;
                }

                return next;
            })
        );
    }

    async function save() {
        setSaving(true);
        setError(null);

        try {
            const res = await fetch(`/planner/api/clinicians/${clinician.id}/day-rules`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "UPDATE_EXISTING",
                    effectiveFrom: date,
                    pattern,
                    rules: weekly.map((row) => ({
                        id: row.id,
                        weekday: row.weekday,
                        activity_code: row.activity_code,
                        start_time: row.start_time,
                        end_time: row.end_time,
                        note: row.note,
                    })),
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error ?? "Failed to save");

            await load();
        } catch (e: any) {
            setError(e?.message ?? "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    const summary = useMemo(() => {
        return {
            st: weekly.filter((r) => r.activity_code === "TESTING").length,
            cl: weekly.filter((r) => r.activity_code === "CL").length,
            gf: weekly.filter((r) => r.activity_code === "GF_DAY").length,
            off: weekly.filter((r) => r.activity_code === "D/O").length,
        };
    }, [weekly]);

    return (
        <div className="min-h-screen bg-[#fbfcff] px-8 py-8 text-[#070b2d]">
            <div className="mx-auto max-w-[1720px]">
                <Link
                    href="/planner/clinicians"
                    className="mb-8 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                    ← Back to Clinicians
                </Link>

                <ClinicianTemplateHeader
                    clinician={clinician}
                    pattern={pattern}
                    setPattern={setPattern}
                    saving={saving}
                    onSave={save}
                />

                {error && (
                    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700">
                        {error}
                    </div>
                )}

                <div className="mt-6 grid grid-cols-[1fr_380px] gap-8">
                    <main>
                        <WeeklySummary summary={summary} />

                        <section className="mt-10">
                            <h2 className="text-2xl font-bold tracking-tight">Day Rules</h2>
                            <p className="mt-2 text-sm font-medium text-slate-500">
                                Configure what the clinician is doing on each day of the week.
                            </p>

                            <DayRulesTable
                                rows={weekly}
                                loading={loading}
                                saving={saving}
                                onChange={updateRule}
                            />
                        </section>

                        <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-medium text-slate-500">
                            ⓘ These rules will be used by the planner when auto-allocating clinics and rooms.
                        </div>

                        <div className="mt-20 border-t border-slate-200 pt-6 text-xs font-medium text-slate-500">
                            All changes are saved when you press Save changes
                        </div>
                    </main>

                    <LiveAllocationPreview
                        preview={preview}
                        loading={loading}
                        lastUpdated={lastUpdated}
                        onRefresh={load}
                    />
                </div>
            </div>
        </div>
    );
}