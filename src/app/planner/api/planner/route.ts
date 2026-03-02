import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const from = searchParams.get("from");
        const to = searchParams.get("to");

        if (!from || !to) {
            return NextResponse.json(
                { error: "Missing from/to", rooms: [], clinicians: [], sessions: [] },
                { status: 400 }
            );
        }

        // IMPORTANT: log what you're actually receiving
        console.log("[/api/planner] from,to =", from, to);

        const [rooms] = await db.query(`SELECT id, name FROM rooms WHERE is_active=1`);
        const [clinicians] = await db.query(`SELECT id, display_name, full_name, role_code, grade_code, is_supervisor, is_active FROM clinicians WHERE is_active=1`);
        const [sessions] = await db.query(
            `SELECT s.*
             FROM sessions s
             WHERE s.session_date >= ?
               AND s.session_date < DATE_ADD(?, INTERVAL 1 DAY)
             ORDER BY s.session_date, s.room_id, s.slot`,
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
        const [dayRules] = await db.query(
            `SELECT clinician_id, weekday, pattern_code, activity_code, start_time, end_time,
                    effective_from, effective_to, note, is_active, is_available_shift
             FROM clinician_day_rule
             WHERE is_active = 1
               AND effective_from <= ?
               AND (effective_to IS NULL OR effective_to >= ?)`,
            [to, from]
        );

        // ✅ clinician lookup
        const clinicianById = new Map<number, any>();
        for (const c of clinicians as any[]) clinicianById.set(Number(c.id), c);

        const isRegisteredOoSupervisor = (c: any) =>
            Number(c.role_code) === 1 &&
            Number(c.grade_code) === 1 &&
            Number(c.is_supervisor) === 1;

// dayKey -> { preRegs, supervisors }
        const dayStatsByDate = new Map<
            string,
            { preRegs: Set<number>; supervisorsClinic: Set<number>; supervisorsStore: Set<number> }
        >();

        function getDayKey(raw: any) {
            return String(raw ?? "").slice(0, 10);
        }

// 1) From SESSIONS: collect pre-reg OOs + supervisor testers
        for (const s of sessions as any[]) {
            const dayKey = getDayKey(s.session_date);
            if (!dayKey) continue;

            if (!dayStatsByDate.has(dayKey)) {
                dayStatsByDate.set(dayKey, {
                    preRegs: new Set(),
                    supervisorsClinic: new Set(),
                    supervisorsStore: new Set(),
                });
            }
            const bucket = dayStatsByDate.get(dayKey)!;

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

// 2) From IN-STORE table: add supervisors present even if not testing
        for (const r of inStoreRows as any[]) {
            const dayKey = getDayKey(r.date);
            if (!dayKey) continue;

            if (!dayStatsByDate.has(dayKey)) {
                dayStatsByDate.set(dayKey, {
                    preRegs: new Set(),
                    supervisorsClinic: new Set(),
                    supervisorsStore: new Set(),
                });
            }
            const bucket = dayStatsByDate.get(dayKey)!;

            const cid = Number(r.clinician_id);
            if (!Number.isFinite(cid) || cid <= 0) continue;

            const c = clinicianById.get(cid);
            if (!c) continue;

            if (isRegisteredOoSupervisor(c)) bucket.supervisorsStore.add(cid);
        }

// 3) Flatten to JSON-friendly shape
        const supervisionByDate = Array.from(dayStatsByDate.entries())
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

        return NextResponse.json({ rooms, clinicians, sessions, supervisionByDate });
    } catch (err: any) {
        console.error("[/api/planner] ERROR:", err);

        // NEVER return {} — return a usable shape + error info
        return NextResponse.json(
            {
                error: err?.message ?? "Unknown error",
                rooms: [],
                clinicians: [],
                sessions: [],
            },
            { status: 500 }
        );
    }

}

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
    supervisionByDate: SupervisionByDateRow[];
};