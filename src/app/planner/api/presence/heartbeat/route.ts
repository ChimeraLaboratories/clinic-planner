import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserFromCookies } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const user = await getCurrentUserFromCookies();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const currentPath =
            typeof body?.currentPath === "string" && body.currentPath.trim()
                ? body.currentPath.trim().slice(0, 255)
                : null;

        const activity =
            body?.activity === "editing" || body?.activity === "viewing"
                ? body.activity
                : "viewing";

        const activeRoomIdRaw = Number(body?.activeRoomId);
        const activeRoomId =
            Number.isInteger(activeRoomIdRaw) && activeRoomIdRaw > 0
                ? activeRoomIdRaw
                : null;

        await db.query(
            `
                INSERT INTO user_presence (user_id, last_seen_at, current_path, activity, active_room_id)
                VALUES (?, NOW(), ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                                         last_seen_at = NOW(),
                                         current_path = VALUES(current_path),
                                         activity = VALUES(activity),
                                         active_room_id = VALUES(active_room_id)
            `,
            [user.id, currentPath, activity, activeRoomId]
        );

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("POST /planner/api/presence/heartbeat failed", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}