import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";

type RoomRow = RowDataPacket & { id: number; name: string };

type SessionRow = RowDataPacket & {
    id: number;
    room_id: number;
    clinician_id: number | null;
    slot: "AM" | "PM" | "FULL" | null;

    clinicianName: string | null;
    grade_code: number | null;
    is_supervisor: number | null;

    supervisor_present: number; // 0/1 from EXISTS
};

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
        return NextResponse.json({ error: "No date" }, { status: 400 });
    }

// ✅ Is a registered OO supervisor in store today (even if not testing)?
    const [inStoreSupRows] = await db.query<RowDataPacket[]>(
        `
            SELECT COUNT(*) AS cnt
            FROM supervisor_in_store sis
                     JOIN clinicians c ON c.id = sis.clinician_id
            WHERE sis.in_store_date = ?
              AND c.is_active = 1
              AND c.role_code = 1
              AND c.grade_code = 1
              AND c.is_supervisor = 1
        `,
        [date]
    );

    const inStoreSupervisorPresent = Number((inStoreSupRows as any[])[0]?.cnt ?? 0) > 0;

    const [rooms] = await db.query<RoomRow[]>(
        `SELECT id, name FROM rooms ORDER BY name`
    );

    const [sessions] = await db.query<SessionRow[]>(
        `
            SELECT
                cs.id,
                cs.room_id,
                cs.clinician_id,
                cs.slot,

                c.full_name AS clinicianName,
                c.grade_code,
                c.is_supervisor,

                EXISTS (
                    SELECT 1
                    FROM sessions cs2
                             JOIN clinicians c2 ON cs2.clinician_id = c2.id
                    WHERE cs2.session_date = cs.session_date
                      AND c2.role_code = 1
                      AND c2.grade_code = 1
                      AND c2.is_supervisor = 1
                ) AS supervisor_present

            FROM sessions cs
                     LEFT JOIN clinicians c ON cs.clinician_id = c.id
            WHERE cs.session_date = ?
            ORDER BY cs.room_id
        `,
        [date]
    );

    // ✅ compute warning flag ONCE
// ✅ compute warning flag ONCE
    const sessionsWithWarnings = sessions.map((s) => ({
        ...s,
        requiresSupervisorWarning:
            Number(s.grade_code) === 2 &&
            Number(s.supervisor_present) === 0 &&
            !inStoreSupervisorPresent,
    }));

    // ✅ build room map
    const roomMap = new Map<number, { id: number; name: string; sessions: any[] }>();
    rooms.forEach((room) => {
        roomMap.set(room.id, { id: room.id, name: room.name, sessions: [] });
    });

    // ✅ IMPORTANT: use sessionsWithWarnings, not sessions
    sessionsWithWarnings.forEach((s) => {
        const room = roomMap.get(Number(s.room_id));
        if (!room) return;

        room.sessions.push({
            id: s.id,
            clinicianId: s.clinician_id,
            clinicianName: (s.clinicianName ?? "").trim() || "Unassigned",
            startTime: null,
            endTime: null,
            slot: s.slot,
            requiresSupervisorWarning: s.requiresSupervisorWarning,
        });
    });

    const roomData = Array.from(roomMap.values()).map((room) => ({
        ...room,
        used: room.sessions.length > 0,
    }));

    return NextResponse.json({
        rooms: roomData,
        stats: {
            totalSessions: sessionsWithWarnings.length,
            roomsUsed: roomData.filter((room) => room.used).length,
            clinicians: new Set(
                sessionsWithWarnings
                    .filter((s) => s.clinician_id != null)
                    .map((s) => s.clinician_id!)
            ).size,
        },
    });
}