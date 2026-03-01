import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function DELETE(_: Request, ctx: RouteContext) {
    const { id } = await ctx.params;

    const sessionId = Number(id);
    if (!Number.isFinite(sessionId) || sessionId <= 0) {
        return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
    }

    const [result] = await db.query(`DELETE FROM sessions WHERE id = ?`, [sessionId]);

    // mysql2 returns OkPacket-like object
    const affectedRows = (result as any)?.affectedRows ?? 0;

    if (affectedRows === 0) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
}