import { getPool } from "./db";

export async function getPlannerData(from: string, to: string) {
    const pool = getPool();

    const [rooms] = await pool.query(`SELECT id, name FROM rooms ORDER BY name`);
    const [clinicians] = await pool.query(`SELECT id, full_name, display_name, role_code AS role, grade_code, goc_number, is_active FROM clinicians ORDER BY full_name`);

    const [sessions] = await pool.query(
        `
            SELECT
                s.id,
                s.session_date AS date,
    s.clinician_id AS clinicianId,
    COALESCE(NULLIF(c.display_name, ''), c.full_name) AS clinicianName,
    s.room_id AS roomId,
    r.name AS roomName,
    s.session_type AS type,
    s.slot AS time,
    s.notes,
    s.status
            FROM sessions s
                LEFT JOIN clinicians c ON c.id = s.clinician_id
                LEFT JOIN rooms r ON r.id = s.room_id
            WHERE s.session_date BETWEEN ? AND ?
            ORDER BY s.session_date ASC
        `,
        [from, to]
    );

    return { rooms, clinicians, sessions };
}