import { db } from "@/lib/db";

type Slot = "FULL" | "AM" | "PM";
type SessionType = "ST" | "CL" | "OTHER";
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
    is_overtime?: number;
}) {
    const {
        session_date,
        room_id,
        clinician_id,
        session_type,
        slot,
        status,
        notes,
        is_overtime = 0,
    } = input;

    const slotsToCheck = conflictSlots(slot);

    // 1) Room conflicts
    const [roomConflicts] = await db.query(
        `
            SELECT id, slot
            FROM sessions
            WHERE session_date = ?
              AND room_id = ?
              AND slot IN (${slotsToCheck.map(() => "?").join(",")})
              AND status <> 'CANCELLED'
                LIMIT 1
        `,
        [session_date, room_id, ...slotsToCheck]
    );

    if ((roomConflicts as any[]).length > 0) {
        const c = (roomConflicts as any[])[0];
        const err: any = new Error(`Room already has a ${c.slot} session on ${session_date}`);
        err.code = "SESSION_CONFLICT";
        throw err;
    }

    if (clinician_id !== null) {
        // 2) Clinician conflicts (already booked)
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

    // 3) Insert
    await db.query(
        `
            INSERT INTO sessions
            (session_date, room_id, clinician_id, session_type, slot, status, notes, is_overtime)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            session_date,
            room_id,
            clinician_id,
            session_type,
            slot,
            status,
            notes,
            is_overtime ? 1 : 0,
        ]
    );
}