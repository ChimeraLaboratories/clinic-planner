"use client";

import { useMemo, useState } from "react";
import type { PlannerResponse } from "../types/planner";

type HolidayRow = {
    id: number | string;
    clinician_id: number;
    clinician_name: string;
    date_from: string; // YYYY-MM-DD
    date_to: string | null; // YYYY-MM-DD
    type?: string | null;
    note?: string | null;
};

function monthRange(anchorMonth: Date) {
    const start = new Date(anchorMonth.getFullYear(), anchorMonth.getMonth(), 1);
    const end = new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() + 1, 0);
    const ymd = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };
    return { from: ymd(start), to: ymd(end) };
}

function inRange(d: string, from: string, to: string) {
    return d >= from && d <= to;
}

export default function HolidayBookedView({
                                              anchorMonth,
                                              data,
                                              ooClinicianId,
                                          }: {
    anchorMonth: Date;
    data: PlannerResponse;
    ooClinicianId: number | null;
}) {
    const [query, setQuery] = useState("");
    const [onlyOO, setOnlyOO] = useState(true);

    const { from, to } = useMemo(() => monthRange(anchorMonth), [anchorMonth]);

    // 👇 Replace this when your API returns holidays.
    // For now it reads from a possible `data.holidays` if you add it later.
    const rawHolidays: HolidayRow[] = ((data as any)?.holidays ?? []) as HolidayRow[];

    const clinicianNameById = useMemo(() => {
        const map = new Map<number, string>();
        for (const c of (data?.clinicians ?? []) as any[]) {
            const id = Number(c?.id);
            if (!Number.isFinite(id)) continue;
            const name =
                String(c?.display_name ?? "").trim() ||
                String(c?.full_name ?? "").trim() ||
                `Clinician ${id}`;
            map.set(id, name);
        }
        return map;
    }, [data?.clinicians]);

    const holidays = useMemo(() => {
        const q = query.trim().toLowerCase();

        return rawHolidays
            .map((h) => {
                const clinician_id = Number((h as any).clinician_id ?? (h as any).clinicianId);
                const date_from = String((h as any).date_from ?? (h as any).date ?? "");
                const date_to = (h as any).date_to ? String((h as any).date_to) : null;

                const clinician_name =
                    String((h as any).clinician_name ?? "").trim() ||
                    clinicianNameById.get(clinician_id) ||
                    `Clinician ${clinician_id}`;

                return {
                    id: (h as any).id ?? `${clinician_id}-${date_from}-${date_to ?? ""}`,
                    clinician_id,
                    clinician_name,
                    date_from,
                    date_to,
                    type: (h as any).type ?? null,
                    note: (h as any).note ?? null,
                } satisfies HolidayRow;
            })
            .filter((h) => h.date_from && inRange(h.date_from, from, to))
            .filter((h) => {
                if (!onlyOO) return true;
                if (ooClinicianId == null) return false;
                return h.clinician_id === ooClinicianId || h.clinician_name.trim().toUpperCase() === "OO";
            })
            .filter((h) => {
                if (!q) return true;
                return (
                    h.clinician_name.toLowerCase().includes(q) ||
                    h.date_from.includes(q) ||
                    (h.date_to ?? "").includes(q) ||
                    String(h.type ?? "").toLowerCase().includes(q) ||
                    String(h.note ?? "").toLowerCase().includes(q)
                );
            })
            .sort((a, b) => a.date_from.localeCompare(b.date_from) || a.clinician_name.localeCompare(b.clinician_name));
    }, [rawHolidays, from, to, query, onlyOO, ooClinicianId, clinicianNameById]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="text-sm font-semibold text-slate-900">Holidays booked</div>
                    <div className="text-xs text-slate-500">
                        Showing {from} → {to}
                    </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="flex items-center gap-2 text-xs text-slate-600 select-none">
                        <input
                            type="checkbox"
                            checked={onlyOO}
                            onChange={(e) => setOnlyOO(e.target.checked)}
                            className="h-4 w-4"
                        />
                        OO only
                    </label>

                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search name / date / note…"
                        className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    />

                    <div className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {holidays.length} total
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-12 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
                    <div className="col-span-4">Clinician</div>
                    <div className="col-span-3">From</div>
                    <div className="col-span-3">To</div>
                    <div className="col-span-2 text-right">Type</div>
                </div>

                {holidays.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                        <div className="text-sm font-semibold text-slate-800">No holidays found</div>
                        <div className="mt-1 text-xs text-slate-500">
                            Add a holiday using the top bar, or change your filters.
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {holidays.map((h) => (
                            <div key={String(h.id)} className="grid grid-cols-12 px-4 py-3 text-sm">
                                <div className="col-span-4 min-w-0">
                                    <div className="font-semibold text-slate-900 truncate">{h.clinician_name}</div>
                                    {h.note ? <div className="mt-0.5 text-xs text-slate-500 truncate">{h.note}</div> : null}
                                </div>
                                <div className="col-span-3 text-slate-800">{h.date_from}</div>
                                <div className="col-span-3 text-slate-800">{h.date_to ?? "—"}</div>
                                <div className="col-span-2 text-right">
                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {h.type ?? "Holiday"}
                  </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Small note so you remember what's left to wire */}
            <div className="text-xs text-slate-500">
                Note: this view currently reads from <span className="font-mono">data.holidays</span>. Add that to your API payload to populate it.
            </div>
        </div>
    );
}