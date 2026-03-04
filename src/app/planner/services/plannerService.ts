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
        // 2) Availability check (effective dating + correct weekday mapping)
        // JS getDay(): 0=Sun..6=Sat (matches your DB convention)
        const weekday0to6 = new Date(session_date + "T00:00:00").getDay();

        const [ruleRows] = await db.query(
            `
        SELECT r.is_available_shift, r.activity_code
        FROM clinician_day_rule r
        JOIN (
          SELECT weekday, MAX(effective_from) AS max_from
          FROM clinician_day_rule
          WHERE clinician_id = ?
            AND is_active = 1
            AND weekday = ?
            AND effective_from <= ?
            AND (effective_to IS NULL OR effective_to >= ?)
          GROUP BY weekday
        ) pick
          ON pick.weekday = r.weekday
         AND pick.max_from = r.effective_from
        WHERE r.clinician_id = ?
          AND r.is_active = 1
          AND r.weekday = ?
        LIMIT 1
      `,
            [clinician_id, weekday0to6, session_date, session_date, clinician_id, weekday0to6]
        );

        const rule = (ruleRows as any[])[0];

        // Default behaviour: if no rule exists -> allow
        if (rule && Number(rule.is_available_shift) !== 1) {
            const err: any = new Error(
                `Clinician is not available for a shift on this day (rule: ${rule.activity_code ?? "?"}).`
            );
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
            const err: any = new Error(`Clinician already booked (${c.slot}) on ${session_date} (room ${c.room_id})`);
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