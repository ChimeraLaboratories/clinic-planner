import {db} from "@/lib/db";

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

    // 1) Room conflicts
    const [roomConflicts] = await db.query(
        `
            SELECT id, slot FROM sessions WHERE session_date = ?
                                            AND room_id = ?
                                            AND slot IN (${slotsToCheck.map(() => "?").join(",")})
                                            AND status <> 'CANCELLED'
                LIMIT 1`,
        [session_date, room_id, ...slotsToCheck]
    );

    if ((roomConflicts as any[]).length > 0) {
        const c = (roomConflicts as any[])[0];
        const err: any = new Error(`Room already has a ${c.slot} session on ${session_date}`);
        err.code = "SESSION_CONFLICT";
        throw err;
    }

    if (clinician_id !== null) {
        // 2) ✅ Availability check against clinician_day_rules
        const [ruleRows] = await db.query(
            `
            SELECT is_available_shift
            FROM clinician_day_rule
            WHERE clinician_id = ?
              AND weekday = DAYOFWEEK(?)
            LIMIT 1
            `,
            [clinician_id, session_date]
        );

        const rule = (ruleRows as any[])[0];

        // Default behaviour:
        // - If no rule row exists -> ALLOW
        // If you want "no rule row -> BLOCK", change to: if (!rule || Number(rule.is_available_shift) !== 1) { ... }
        if (rule && Number(rule.is_available_shift) !== 1) {
            const err: any = new Error("Clinician is not available for a shift on this day.");
            err.code = "CLINICIAN_NOT_AVAILABLE_SHIFT";
            throw err;
        }

        // 3) Clinician conflicts (already booked)
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

    // 4) Insert
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