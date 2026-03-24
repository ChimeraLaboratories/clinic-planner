import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const currentPath =
            typeof body?.currentPath === "string" && body.currentPath.trim()
                ? body.currentPath.trim().slice(0, 255)
                : null;

        await db.query(
            `
            INSERT INTO user_presence (user_id, last_seen_at, current_path)
            VALUES (?, NOW(), ?)
            ON DUPLICATE KEY UPDATE
                last_seen_at = NOW(),
                current_path = VALUES(current_path)
            `,
            [user.id, currentPath]
        );

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("POST /planner/api/presence/heartbeat failed", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}