// src/app/planner/api/planner/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export type SupervisionByDateRow = {
    date: string;
    preRegCount: number;
    supervisorCount: number;
    supervisorInClinicCount: number;
    supervisorInStoreCount: number;
    needsSupervisor: boolean;
    preRegs: string;
    supervisors: string;
    supervisorsInClinic: string;
    supervisorsInStore: string;
};

export type PlannerResponse = {
    rooms: any[];
    clinicians: any[];
    sessions: any[];
    supervisionByDate: any[];
    stats: {
        totalStValue: number;
        totalClValue: number;
    };
    dayRules: any[]; // ✅ add this
};

function dayKey(raw: any): string {
    return String(raw ?? "").slice(0, 10);
}

function getClinicCode(s: any): string {
    return String(
        s?.session_type ?? s?.type ?? s?.clinic_code ?? s?.clinicCode ?? ""
    )
        .trim()
        .toUpperCase();
}

function getNumericValue(s: any): number {
    const raw =
        s?.st_value ??
        s?.value ??
        s?.session_value ??
        s?.clinic_value ??
        s?.sessionValue ??
        s?.clinicValue ??
        0;

    const n = typeof raw === "number" ? raw : Number(String(raw).trim());
    return Number.isFinite(n) ? n : 0;
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const from = searchParams.get("from");
        const to = searchParams.get("to");

        if (!from || !to) {
            return NextResponse.json(
                {
                    error: "Missing from/to",
                    rooms: [],
                    clinicians: [],
                    sessions: [],
                    supervisionByDate: [],
                    stats: { totalStValue: 0, totalClValue: 0 },
                },
                { status: 400 }
            );
        }

        console.log("[/api/planner] from,to =", from, to);

        const [rooms] = await db.query<RowDataPacket[]>(
            `SELECT id, name FROM rooms WHERE is_active=1`
        );

        const [clinicians] = await db.query<RowDataPacket[]>(
            `SELECT id, display_name, full_name, role_code, grade_code, is_supervisor, is_active
       FROM clinicians
       WHERE is_active=1`
        );

        // ✅ Sessions inclusive of 'to' date (any time on that day)
        const [sessions] = await db.query<RowDataPacket[]>(
            `
                SELECT
                    s.*,
                    CASE
                        WHEN UPPER(s.session_type) LIKE 'ST%' THEN COALESCE(cc.st_value, 0)
                        WHEN UPPER(s.session_type) LIKE 'CL%' THEN COALESCE(cc.cl_value, 0)
                        ELSE 0
                        END AS value
                FROM sessions s
                    LEFT JOIN clinician_capacity cc
                ON cc.clinician_id = s.clinician_id
                    AND cc.effective_from <= DATE(s.session_date)
                    AND (cc.effective_to IS NULL OR cc.effective_to >= DATE(s.session_date))
                WHERE s.session_date >= ?
                  AND s.session_date < DATE_ADD(?, INTERVAL 1 DAY)
                ORDER BY s.session_date, s.room_id, s.slot
            `,
            [from, to]
        );

        // ✅ Load supervisors marked as "in store"
        const [inStoreRows] = await db.query(
            `
      SELECT in_store_date as date, clinician_id
      FROM supervisor_in_store
      WHERE in_store_date BETWEEN ? AND ?
      `,
            [from, to]
        );

        const [dayRules] = await db.query<RowDataPacket[]>(
            `
      SELECT clinician_id, weekday, pattern_code, activity_code, start_time, end_time,
             effective_from, effective_to, note, is_active, is_available_shift
      FROM clinician_day_rule
      WHERE is_active = 1
        AND effective_from <= ?
        AND (effective_to IS NULL OR effective_to >= ?)
      `,
            [to, from]
        );

        // ✅ clinician lookup
        const clinicianById = new Map<number, any>();
        for (const c of clinicians as any[]) clinicianById.set(Number(c.id), c);

        const isRegisteredOoSupervisor = (c: any) =>
            Number(c.role_code) === 1 &&
            Number(c.grade_code) === 1 &&
            Number(c.is_supervisor) === 1;

        // =========================
        // 1) Compute ST / CL totals
        // =========================
        let totalStValue = 0;
        let totalClValue = 0;

        for (const s of sessions as any[]) {
            const code = getClinicCode(s);
            const v = getNumericValue(s);

            if (code.startsWith("ST")) totalStValue += v;
            if (code.startsWith("CL")) totalClValue += v;
        }

        // ==========================================
        // 2) Supervision stats by date (your logic)
        // ==========================================
        const dayStatsByDate = new Map<
            string,
            { preRegs: Set<number>; supervisorsClinic: Set<number>; supervisorsStore: Set<number> }
        >();

        // From SESSIONS: collect pre-reg OOs + supervisor testers
        for (const s of sessions as any[]) {
            const dk = dayKey(s.session_date);
            if (!dk) continue;

            if (!dayStatsByDate.has(dk)) {
                dayStatsByDate.set(dk, {
                    preRegs: new Set(),
                    supervisorsClinic: new Set(),
                    supervisorsStore: new Set(),
                });
            }

            const bucket = dayStatsByDate.get(dk)!;

            const cid = Number(s.clinician_id);
            if (!Number.isFinite(cid) || cid <= 0) continue;

            const c = clinicianById.get(cid);
            if (!c) continue;

            const role = Number(c.role_code);
            const grade = Number(c.grade_code);

            // pre-reg OO: role_code=1, grade_code=2
            if (role === 1 && grade === 2) bucket.preRegs.add(cid);

            // registered supervisor OO: role_code=1, grade_code=1, is_supervisor=1
            if (isRegisteredOoSupervisor(c)) bucket.supervisorsClinic.add(cid);
        }

        // From IN-STORE table: add supervisors present even if not testing
        for (const r of inStoreRows as any[]) {
            const dk = dayKey(r.date);
            if (!dk) continue;

            if (!dayStatsByDate.has(dk)) {
                dayStatsByDate.set(dk, {
                    preRegs: new Set(),
                    supervisorsClinic: new Set(),
                    supervisorsStore: new Set(),
                });
            }

            const bucket = dayStatsByDate.get(dk)!;

            const cid = Number(r.clinician_id);
            if (!Number.isFinite(cid) || cid <= 0) continue;

            const c = clinicianById.get(cid);
            if (!c) continue;

            if (isRegisteredOoSupervisor(c)) bucket.supervisorsStore.add(cid);
        }

        // Flatten to JSON-friendly shape
        const supervisionByDate: SupervisionByDateRow[] = Array.from(
            dayStatsByDate.entries()
        )
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, b]) => {
                const allSupervisors = new Set<number>([
                    ...Array.from(b.supervisorsClinic),
                    ...Array.from(b.supervisorsStore),
                ]);

                const toNames = (ids: Iterable<number>) =>
                    Array.from(ids)
                        .map((id) => clinicianById.get(id)?.display_name ?? `#${id}`)
                        .join(", ");

                return {
                    date,
                    preRegCount: b.preRegs.size,
                    supervisorInClinicCount: b.supervisorsClinic.size,
                    supervisorInStoreCount: b.supervisorsStore.size,
                    supervisorCount: allSupervisors.size,
                    needsSupervisor: b.preRegs.size > 0 && allSupervisors.size === 0,
                    preRegs: toNames(b.preRegs),
                    supervisorsInClinic: toNames(b.supervisorsClinic),
                    supervisorsInStore: toNames(b.supervisorsStore),
                    supervisors: toNames(allSupervisors),
                };
            });

        return NextResponse.json({
            rooms,
            clinicians,
            sessions,
            supervisionByDate,
            stats: { totalStValue, totalClValue },
            // leaving this here in case your UI uses it later; remove if unused
            dayRules,
        } satisfies PlannerResponse);
    } catch (err: any) {
        console.error("[/api/planner] ERROR:", err);

        return NextResponse.json(
            {
                error: err?.message ?? "Unknown error",
                rooms: [],
                clinicians: [],
                sessions: [],
                supervisionByDate: [],
                stats: { totalStValue: 0, totalClValue: 0 },
            },
            { status: 500 }
        );
    }
}