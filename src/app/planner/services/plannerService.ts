import { db } from "@/lib/db";

type Slot = "FULL" | "AM" | "PM";
type SessionType = "ST" | "CL";
type Status = "DRAFT" | "PUBLISHED" | "CANCELLED";

function conflictSlots(slot: Slot): Slot[] {
    return slot === "FULL" ? ["FULL", "AM", "PM"] : [slot, "FULL"];
}

export async function createSession(input: {
    session_date: string;
    room_id: number;
    clinician_id: number | null;
    session_type: SessionType;
    slot: Slot;
    status: Status;
    notes: string | null;
}) {
    const { session_date, room_id, clinician_id, session_type, slot, status, notes } = input;

    const slotsToCheck = conflictSlots(slot);

    const [roomConflicts] = await db.query(
        `
        SELECT id, slot FROM sessions WHERE session_date = ?
        AND room_id = ?
        AND slot IN (${slotsToCheck.map(() => "?").join(",")})
        AND status <> 'CANCELLED'
        LIMIT 1`, [session_date, room_id, ... slotsToCheck]
    );

    if ((roomConflicts as any[]).length > 0) {
        const c = (roomConflicts as any[])[0];
        const err: any = new Error(`Room already has a ${c.slot} session on ${session_date}`);
        err.code = "SESSION_CONFLICT";
        throw err;
    }

    if (clinician_id) {
        const [clinicianConflicts] = await db.query(
            `
      SELECT id, slot, room_id
      FROM sessions
      WHERE session_date = ?
        AND clinician_id = ?
        AND slot IN (${slotsToCheck.map(() => "?").join(",")})
        AND status <> 'CANCELLED'
      LIMIT 1
      `,
            [session_date, clinician_id, ...slotsToCheck]
        );

        if ((clinicianConflicts as any[]).length > 0) {
            const c = (clinicianConflicts as any[])[0];
            const err: any = new Error(
                `Clinician already booked (${c.slot}) on ${session_date} (room ${c.room_id})`
            );
            err.code = "SESSION_CONFLICT";
            throw err;
        }
    }

    await db.query(
        `
    INSERT INTO sessions
      (session_date, room_id, clinician_id, session_type, slot, status, notes)
    VALUES
      (?, ?, ?, ?, ?, ?, ?)
    `,
        [session_date, room_id, clinician_id, session_type, slot, status, notes]
    );
}

export async function getPlannerData(from: string, to: string) {

    const [rooms] = await db.query(`SELECT id, name FROM rooms ORDER BY name`);
    const [clinicians] = await db.query(`SELECT id, full_name, display_name, role_code AS role, grade_code, goc_number, is_active FROM clinicians ORDER BY full_name`);

    const [sessions] = await db.query(
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