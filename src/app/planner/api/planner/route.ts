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
        const [clinicians] = await db.query(`SELECT id, display_name, role_code, grade_code FROM clinicians WHERE is_active=1`);
        const [sessions] = await db.query(
            `SELECT id, session_date, room_id, clinician_id, status
       FROM sessions
       WHERE session_date BETWEEN ? AND ?
       ORDER BY session_date`,
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