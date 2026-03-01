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
        id: number;
        room_id: number;
        clinician_id: number | null;
        full_name: string | null;
    };

    const [sessions] = await db.query<SessionRow[]>(
        `
            SELECT
                s.id,
                s.room_id,
                s.clinician_id,
                c.full_name
            FROM sessions s
                     LEFT JOIN clinicians c ON c.id = s.clinician_id
            WHERE s.session_date = ?
            ORDER BY s.room_id, s.id
        `,
        [date]
    );

    const usedRoomIds = new Set(sessions.map((s) => s.room_id));
    const clinicianIds = new Set(
        sessions.filter((s) => s.clinician_id != null).map((s) => s.clinician_id!)
    );

    const roomMap = new Map<number, { id: number; name: string; sessions: any[] }>();

    rooms.forEach((room) => {
        roomMap.set(room.id, { id: room.id, name: room.name, sessions: [] });
    });

    sessions.forEach((s) => {
        const room = roomMap.get(s.room_id);
        if (!room) return;

        room.sessions.push({
            id: s.id,
            clinicianId: s.clinician_id,
            clinicianName: s.full_name ?? "Unassigned",
            startTime: null,
            endTime: null,
        });
    });

    const roomData = Array.from(roomMap.values()).map((room) => ({
        ...room,
        used: room.sessions.length >0,
    }));

    return NextResponse.json({
        rooms: roomData,
        stats: {
            totalSession: sessions.length,
            roomsUsed: roomData.filter((room) => room.used).length,
            clinicians: new Set(
                sessions.filter((s) => s.clinician_id != null).map((s) => s.clinician_id!)
            ).size,
        },
    });
}