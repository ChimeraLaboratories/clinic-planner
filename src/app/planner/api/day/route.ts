import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";

type RoomRow = RowDataPacket & { id: number; name: string };
type SessionRow = RowDataPacket & { room_id: number; clinician_id: number | null };

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
        return NextResponse.json({ error: "No date" }, { status: 400 });
    }

    const [rooms] = await db.query<RoomRow[]>(
        `SELECT id, name FROM rooms ORDER BY name`
    );

    type SessionRow = RowDataPacket & {
        room_id: number;
        clinician_id: number | null;
        full_name: string | null;
    };

    const [sessions] = await db.query<SessionRow[]>(
        `
            SELECT
                s.room_id,
                s.clinician_id,
                c.full_name
            FROM sessions s
                     LEFT JOIN clinicians c ON c.id = s.clinician_id
            WHERE s.session_date = ?
        `,
        [date]
    );

    const usedRoomIds = new Set(sessions.map((s) => s.room_id));
    const clinicianIds = new Set(
        sessions.filter((s) => s.clinician_id != null).map((s) => s.clinician_id!)
    );

    const roomData = rooms.map((room) => ({
        id: room.id,
        name: room.name,
        used: usedRoomIds.has(room.id),
    }));

    const roomMap = new Map<number, { id: number; name: string; clinicians: string[] }>();

    rooms.forEach((room) => {
        roomMap.set(room.id, {
            id: room.id,
            name: room.name,
            clinicians: [],
        });
    });

    sessions.forEach((s) => {
        if (s.clinician_id && s.full_name) {
            const room = roomMap.get(s.room_id);
            if (room) {
                room.clinicians.push(s.full_name);
            }
        }
    });

    return NextResponse.json({
        rooms: Array.from(roomMap.values()).map((r) => ({
            ...r,
            used: r.clinicians.length > 0,
        })),
        stats: {
            totalSessions: sessions.length,
            roomsUsed: Array.from(roomMap.values()).filter(
                (r) => r.clinicians.length > 0
            ).length,
            clinicians: new Set(sessions.map((s) => s.clinician_id)).size,
        },
    });
}