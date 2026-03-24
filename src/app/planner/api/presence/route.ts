import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";
import { getCurrentUserFromCookies } from "@/lib/auth";

type PresenceRow = RowDataPacket & {
    user_id: number;
    full_name: string | null;
    role: string | null;
    job_role: string | null;
    current_path: string | null;
    activity: string | null;
    active_room_id: number | null;
    last_seen_at: Date | string;
    is_online: number;
};

export async function GET() {
    try {
        const user = await getCurrentUserFromCookies();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [rows] = await db.query<PresenceRow[]>(
            `
                SELECT
                    u.id AS user_id,
                    u.full_name,
                    u.role,
                    u.job_role,
                    p.current_path,
                    p.activity,
                    p.active_room_id,
                    p.last_seen_at,
                    CASE
                        WHEN p.last_seen_at >= DATE_SUB(NOW(), INTERVAL 60 SECOND) THEN 1
                        ELSE 0
                        END AS is_online
                FROM user_presence p
                         INNER JOIN users u
                                    ON u.id = p.user_id
                ORDER BY is_online DESC, COALESCE(u.full_name, '') ASC
            `
        );

        return NextResponse.json({
            users: rows.map((r) => ({
                userId: r.user_id,
                name: r.full_name || `User ${r.user_id}`,
                role: r.role,
                jobRole: r.job_role,
                currentPath: r.current_path,
                activity: r.activity,
                activeRoomId:
                    r.active_room_id == null ? null : Number(r.active_room_id),
                lastSeenAt:
                    r.last_seen_at instanceof Date
                        ? r.last_seen_at.toISOString()
                        : String(r.last_seen_at),
                isOnline: Number(r.is_online) === 1,
            })),
        });
    } catch (error) {
        console.error("GET /planner/api/presence failed", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}