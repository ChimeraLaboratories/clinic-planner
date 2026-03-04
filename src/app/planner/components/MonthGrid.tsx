"use client";
import type { PlannerResponse } from "../types/planner";

import {
    buildMonthGrid,
    getFirstFullWeekend,
    isSameMonth,
    toISODate,
} from "../utils/date";

import DayCell from "./DayCell";

import { useMemo } from "react";

import { useRouter } from "next/navigation";
import { getWeekPatternFromYmd } from "@/lib/WeekPattern";

function ym(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
}

function ymdLocal(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function dateKeyFromAny(input: any): string {
    if (!input) return "";
    if (input instanceof Date) return ymdLocal(input);
    const s = String(input).trim();
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : "";
}

function addDays(ymd: string, days: number) {
    // ymd is "YYYY-MM-DD"
    const [y, m, d] = ymd.split("-").map((x) => Number(x));
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    dt.setDate(dt.getDate() + days);
    return ymdLocal(dt);
}

function buildTrainingKeys(anchorMonth: Date) {
    const year = anchorMonth.getFullYear();
    const month = anchorMonth.getMonth();
    const wk = getFirstFullWeekend(year, month);

    if (!wk) return new Set<string>();

    const sat = new Date(year, month, wk.saturday);
    const sun = new Date(year, month, wk.sunday);

    return new Set([toISODate(sat), toISODate(sun)]);
}

/**
 * Treat these activity codes as "NOT expected to be assigned a session".
 * (Matches your sidebar logic style.)
 */
function isWorkingActivity(activityCodeRaw: any): boolean {
    const a = String(activityCodeRaw ?? "").trim().toUpperCase();
    if (!a) return false;

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

    return !notWorking.has(a);
}

function ruleAppliesPattern(rule: any, weekPattern: string): boolean {
    const p = String(rule?.pattern_code ?? "").trim().toUpperCase();
    return p === weekPattern;
}

function weekdayMatchesRule(date: Date, rule: any): boolean {
    const jsDay = date.getDay(); // Sun=0..Sat=6
    const raw =
        rule?.weekday ??
        rule?.uk_day ??
        rule?.day_of_week ??
        rule?.dayOfWeek ??
        rule?.dow;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0 && n <= 6) return n === jsDay;
    return false;
}

export default function MonthGrid({
                                      anchorMonth,
                                      data,
                                  }: {
    anchorMonth: Date;
    data: PlannerResponse;
    onRefresh: () => void | Promise<void>;
}) {
    const router = useRouter();

    const monthParam = ym(anchorMonth);

    const days = buildMonthGrid(anchorMonth);
    const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const totalRooms = data.rooms?.length ?? 0;

    const trainingKeys = useMemo(() => buildTrainingKeys(anchorMonth), [anchorMonth]);

    const roomsById = useMemo(() => {
        const m = new Map<number, string>();
        for (const r of (data?.rooms ?? []) as any[]) m.set(Number(r.id), String(r.name));
        return m;
    }, [data]);

    const cliniciansById = useMemo(() => {
        const m = new Map<number, string>();
        for (const c of (data?.clinicians ?? []) as any[])
            m.set(Number(c.id), String(c.full_name ?? c.display_name ?? ""));
        return m;
    }, [data]);

    // ✅ Group by day_key FIRST (stable)
    const sessionsByDay = useMemo(() => {
        const map: Record<string, any[]> = {};
        for (const s of (data?.sessions ?? []) as any[]) {
            const key = dateKeyFromAny(
                s.day_key ?? s.dayKey ?? s.date_key ?? s.session_date ?? s.date ?? s.sessionDate
            );
            if (!key) continue;
            (map[key] ??= []).push(s);
        }
        return map;
    }, [data?.sessions]);

    // ✅ Find OO clinician id from clinicians list (by display_name or full_name)
    const ooClinicianId = useMemo(() => {
        const list = (data?.clinicians ?? []) as any[];
        const oo = list.find((c) => {
            const dn = String(c?.display_name ?? "").trim().toUpperCase();
            const fn = String(c?.full_name ?? "").trim().toUpperCase();
            return dn === "OO" || fn === "OO";
        });

        const id = oo?.id ?? null;
        const n = Number(id);
        return Number.isFinite(n) ? n : null;
    }, [data?.clinicians]);

    // ✅ Add OO holiday for a date
    async function addOoHoliday(dateKey: string) {
        if (!ooClinicianId) return;

        await fetch(`/api/clinicians/${ooClinicianId}/holidays`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: dateKey }),
        });

        router.refresh();
    }

    // ✅ NEW: compute "missing expected clinicians" per dateKey (based on dayRules vs assigned sessions),
    //        excluding clinicians who are on holiday that date.
    const missingExpectedCountByDay = useMemo(() => {
        const out: Record<string, number> = {};
        const rules = (data?.dayRules ?? []) as any[];
        const holidays = (data?.holidays ?? []) as any[];

        // Build set of visible dateKeys to keep holiday expansion cheap
        const visibleKeys = new Set<string>(days.map((d) => ymdLocal(d)));

        // Build lookup: dateKey -> Set(clinician_id) on holiday
        const holidayByDate = new Map<string, Set<number>>();

        for (const h of holidays) {
            const cid = Number(h?.clinician_id ?? h?.clinicianId);
            if (!Number.isFinite(cid) || cid <= 0) continue;

            const single = String(h?.date ?? "").slice(0, 10);
            if (single) {
                if (!visibleKeys.has(single)) continue;
                const set = holidayByDate.get(single) ?? new Set<number>();
                set.add(cid);
                holidayByDate.set(single, set);
                continue;
            }

            const from = String(h?.date_from ?? h?.from ?? "").slice(0, 10);
            if (!from) continue;

            const to = String(h?.date_to ?? h?.to ?? "").slice(0, 10) || from;

            let cur = from;
            let guard = 0;
            while (cur <= to && guard < 400) {
                if (visibleKeys.has(cur)) {
                    const set = holidayByDate.get(cur) ?? new Set<number>();
                    set.add(cid);
                    holidayByDate.set(cur, set);
                }
                cur = addDays(cur, 1);
                guard++;
            }
        }

        for (const d of days) {
            const dateKey = ymdLocal(d);
            const weekPattern = getWeekPatternFromYmd(dateKey); // "W1" | "W2"

            // expected clinician ids for this day
            const expected = new Set<number>();
            for (const r of rules) {
                if (!weekdayMatchesRule(d, r)) continue;
                if (!ruleAppliesPattern(r, weekPattern)) continue;
                if (!isWorkingActivity(r?.activity_code)) continue;

                const cid = Number(r?.clinician_id);
                if (Number.isFinite(cid) && cid > 0) expected.add(cid);
            }

            // ✅ remove clinicians on holiday for this dateKey
            const holidaySet = holidayByDate.get(dateKey);
            if (holidaySet && holidaySet.size > 0) {
                for (const cid of holidaySet) expected.delete(cid);
            }

            if (expected.size === 0) {
                out[dateKey] = 0;
                continue;
            }

            // assigned clinician ids for this day (from sessions)
            const assigned = new Set<number>();
            const daySessions = (sessionsByDay[dateKey] ?? []) as any[];
            for (const s of daySessions) {
                const status = String(s?.status ?? "").trim().toUpperCase();
                if (status === "CANCELLED") continue;

                const cid = Number(s?.clinician_id ?? s?.clinicianId);
                if (Number.isFinite(cid) && cid > 0) assigned.add(cid);
            }

            let missing = 0;
            for (const cid of expected) if (!assigned.has(cid)) missing++;

            out[dateKey] = missing;
        }

        return out;
    }, [data?.dayRules, data?.holidays, days, sessionsByDay]);

    return (
        <div>
            <div className="grid grid-cols-7 bg-slate-50 border border-slate-200 border-b-0 rounded-t-xl text-sm font-medium text-slate-600">
                {dow.map((d) => (
                    <div key={d} className="px-2 py-2">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {days.map((d) => {
                    const dateKey = ymdLocal(d);
                    const inMonth = isSameMonth(d, anchorMonth);

                    return (
                        <DayCell
                            key={dateKey}
                            date={d}
                            dateKey={dateKey}
                            inMonth={inMonth}
                            sessions={(sessionsByDay[dateKey] ?? []) as any}
                            totalRooms={totalRooms}
                            roomsById={roomsById}
                            cliniciansById={cliniciansById}
                            onSelect={(key) => router.push(`/planner/${key}?m=${monthParam}`)}
                            isTrainingWeekend={inMonth && trainingKeys.has(toISODate(d))}
                            // ✅ NEW: show flag on month cell when not all expected clinicians are assigned
                            missingExpectedCount={inMonth ? (missingExpectedCountByDay[dateKey] ?? 0) : 0}
                            // ✅ existing
                            onAddOoHoliday={addOoHoliday}
                        />
                    );
                })}
            </div>
        </div>
    );
}