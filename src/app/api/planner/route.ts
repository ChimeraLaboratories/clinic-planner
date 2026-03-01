import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const from = searchParams.get("from");
        const to = searchParams.get("to");

        if (!from || !to) {
            return NextResponse.json({ error: "Missing date range" }, {status: 400});
        }

        const pool = getPool();

        const [rooms] = await pool.query("SELECT id, name FROM rooms WHERE is_active=1 ORDER BY name");

        const [clinicians] = await pool.query(
            `
      SELECT c.id, c.display_name, c.role_code, r.role_name
      FROM clinicians c
      JOIN clinician_roles r ON r.role_code = c.role_code
      WHERE c.is_active=1
      ORDER BY c.display_name
      `
        );

        const [sessions] = await pool.query(
            `
      SELECT id, date, start_time, end_time, room_id, clinician_id, status
      FROM clinic_sessions
      WHERE date BETWEEN ? AND ?
      ORDER BY date, start_time
      `,
            [from, to]
        );

        return NextResponse.json({
            rooms,
            clinicians,
            sessions,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({error: "Server error"},{status:500});
    }
}