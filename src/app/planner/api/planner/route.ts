import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // whatever you use

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
        const [clinicians] = await db.query(`SELECT id, display_name, role_code, grade_code, is_supervisor FROM clinicians WHERE is_active=1`);
        const [sessions] = await db.query(
            `
                SELECT
                    s.id,
                    s.session_date,
                    s.room_id,
                    s.clinician_id,
                    s.status,
                    s.session_type,

                    CASE
                        WHEN UPPER(s.session_type) = 'ST'
                            THEN COALESCE(cc.st_value, 0)
                        WHEN UPPER(s.session_type) = 'CL'
                            THEN COALESCE(cc.cl_value, 0)
                        ELSE 0
                        END AS value

                FROM sessions s

                    LEFT JOIN clinician_capacity cc
                ON cc.clinician_id = s.clinician_id
                    AND DATE(s.session_date) BETWEEN cc.effective_from
                    AND COALESCE(cc.effective_to, '9999-12-31')

                WHERE s.session_date BETWEEN ? AND ?
                ORDER BY s.session_date, s.room_id, s.id
            `,
            [from, to]
        );

        return NextResponse.json({ rooms, clinicians, sessions });
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