import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export async function GET() {
    const [rooms] = await db.query(`
    SELECT
      id,
      name,
      room_type
    FROM rooms
    WHERE is_active = 1
    ORDER BY id ASC
  `);

    const [optometrists] = await db.query(`
    SELECT
      id,
      full_name AS fullName
    FROM clinicians
    WHERE is_active = 1
    ORDER BY full_name ASC
  `);

    const [savedAssignments] = await db.query(`
    SELECT
      clinician_id AS clinicianId,
      room_id AS roomId,
      priority
    FROM clinician_room_priority
    WHERE is_active = 1
    ORDER BY room_id ASC, priority ASC
  `);

    return NextResponse.json({
        rooms,
        optometrists: (optometrists as any[]).map((optom) => ({
            ...optom,
            initials: getInitials(optom.fullName),
        })),
        assignments: savedAssignments,
    });
}

export async function PUT(req: NextRequest) {
    const body = await req.json();

    const assignments = body.assignments as Record<
        string,
        { id: number | string }[]
    >;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const activeKeys = new Set<string>();

        for (const [roomId, clinicians] of Object.entries(assignments)) {
            for (let index = 0; index < clinicians.length; index++) {
                const clinician = clinicians[index];
                const priority = index + 1;

                activeKeys.add(`${clinician.id}-${roomId}`);

                await connection.query(
                    `
          INSERT INTO clinician_room_priority
            (clinician_id, room_id, priority, is_active)
          VALUES (?, ?, ?, 1)
          ON DUPLICATE KEY UPDATE
            priority = IF(priority <> VALUES(priority), VALUES(priority), priority),
            is_active = IF(is_active <> 1, 1, is_active),
            updated_at = IF(
              priority <> VALUES(priority) OR is_active <> 1,
              CURRENT_TIMESTAMP,
              updated_at
            )
          `,
                    [clinician.id, roomId, priority],
                );
            }
        }

        const [existingRows] = await connection.query(`
      SELECT clinician_id AS clinicianId, room_id AS roomId
      FROM clinician_room_priority
      WHERE is_active = 1
    `);

        for (const row of existingRows as any[]) {
            const key = `${row.clinicianId}-${row.roomId}`;

            if (!activeKeys.has(key)) {
                await connection.query(
                    `
          UPDATE clinician_room_priority
          SET is_active = 0,
              updated_at = CURRENT_TIMESTAMP
          WHERE clinician_id = ?
            AND room_id = ?
            AND is_active = 1
          `,
                    [row.clinicianId, row.roomId],
                );
            }
        }

        await connection.commit();

        return NextResponse.json({ success: true });
    } catch (error) {
        await connection.rollback();
        console.error(error);

        return NextResponse.json(
            { error: "Failed to save room assignments" },
            { status: 500 },
        );
    } finally {
        connection.release();
    }
}