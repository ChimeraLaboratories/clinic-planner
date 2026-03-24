import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

type PresenceRow = RowDataPacket & {
    user_id: number;
    display_name: string | null;
    full_name: string | null;
    role: string | null;
    current_path: string | null;
    last_seen_at: string;
    is_online: number;
};

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [rows] = await db.query<PresenceRow[]>(
            `
            SELECT
                u.id AS user_id,
                u.display_name,
                u.full_name,
                u.role,
                p.current_path,
                DATE_FORMAT(p.last_seen_at, '%Y-%m-%d %H:%i:%s') AS last_seen_at,
                CASE
                    WHEN p.last_seen_at >= (NOW() - INTERVAL 60 SECOND) THEN 1
                    ELSE 0
                END AS is_online
            FROM user_presence p
            INNER JOIN users u
                ON u.id = p.user_id
            ORDER BY is_online DESC, COALESCE(u.display_name, u.full_name, '') ASC
            `
        );

        return NextResponse.json({
            users: rows.map((r) => ({
                userId: r.user_id,
                name: r.display_name || r.full_name || `User ${r.user_id}`,
                role: r.role,
                currentPath: r.current_path,
                lastSeenAt: r.last_seen_at,
                isOnline: !!r.is_online,
            })),
        });
    } catch (error) {
        console.error("GET /planner/api/presence failed", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}