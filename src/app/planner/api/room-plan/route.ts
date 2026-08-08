import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type RoomPlanAssignment = {
    clinicianId: number;
    weekday: number;
    roomId: number;
};

export async function GET() {
    try {
        const [rooms] = await db.query(`
            SELECT
                id,
                name,
                room_type AS roomType
            FROM rooms
            WHERE is_active = 1
            ORDER BY id ASC
        `);

        const [clinicians] = await db.query(`
            SELECT
                id,
                display_name AS fullName,
                role_code AS roleCode
            FROM clinicians
            WHERE is_active = 1
            ORDER BY display_name ASC
        `);

        const [assignments] = await db.query(`
            SELECT
                clinician_id AS clinicianId,
                weekday,
                room_id AS roomId
            FROM clinician_room_day_assignment
            WHERE is_active = 1
            ORDER BY weekday ASC, room_id ASC
        `);

        return NextResponse.json({
            rooms,
            clinicians,
            assignments,
        });
    } catch (error) {
        console.error("[room-plan][GET]", error);

        return NextResponse.json(
            {
                error: "Failed to load room plan",
            },
            {
                status: 500,
            },
        );
    }
}

export async function PUT(req: NextRequest) {
    const body = await req.json();

    const assignments = body.assignments as RoomPlanAssignment[];

    if (!Array.isArray(assignments)) {
        return NextResponse.json(
            {
                error: "Invalid room plan",
            },
            {
                status: 400,
            },
        );
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const activeKeys = new Set<string>();

        for (const assignment of assignments) {
            const clinicianId = Number(assignment.clinicianId);
            const weekday = Number(assignment.weekday);
            const roomId = Number(assignment.roomId);

            if (
                !Number.isInteger(clinicianId) ||
                !Number.isInteger(roomId) ||
                !Number.isInteger(weekday) ||
                weekday < 1 ||
                weekday > 7
            ) {
                throw new Error("Invalid room plan assignment");
            }

            const key = `${clinicianId}-${weekday}`;

            activeKeys.add(key);

            await connection.query(
                `
                INSERT INTO clinician_room_day_assignment
                    (
                        clinician_id,
                        weekday,
                        room_id,
                        is_active
                    )
                VALUES (?, ?, ?, 1)

                ON DUPLICATE KEY UPDATE
                    room_id = VALUES(room_id),
                    is_active = 1
                `,
                [
                    clinicianId,
                    weekday,
                    roomId,
                ],
            );
        }

        const [existingRows] = await connection.query(`
            SELECT
                clinician_id AS clinicianId,
                weekday
            FROM clinician_room_day_assignment
            WHERE is_active = 1
        `);

        for (const row of existingRows as {
            clinicianId: number;
            weekday: number;
        }[]) {
            const key = `${row.clinicianId}-${row.weekday}`;

            if (!activeKeys.has(key)) {
                await connection.query(
                    `
                    UPDATE clinician_room_day_assignment
                    SET is_active = 0
                    WHERE clinician_id = ?
                      AND weekday = ?
                      AND is_active = 1
                    `,
                    [
                        row.clinicianId,
                        row.weekday,
                    ],
                );
            }
        }

        await connection.commit();

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        await connection.rollback();

        console.error("[room-plan][PUT]", error);

        return NextResponse.json(
            {
                error: "Failed to save room plan",
            },
            {
                status: 500,
            },
        );
    } finally {
        connection.release();
    }
}