import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit/audit";
import { getRequestAuditContext } from "@/lib/audit/audit-request";
import { AuditAction } from "@/lib/audit/audit-actions";
import { getCurrentUserFromCookies } from "@/lib/auth";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function DELETE(_: Request, ctx: RouteContext) {
    const { id } = await ctx.params;

    const sessionId = Number(id);
    if (!Number.isFinite(sessionId) || sessionId <= 0) {
        return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
    }

    const currentUser = await getCurrentUserFromCookies();

    const [rows] = await db.query(
        `
        SELECT
            id,
            session_date,
            room_id,
            clinician_id,
            session_type,
            slot,
            status,
            notes
        FROM sessions
        WHERE id = ?
        LIMIT 1
        `,
        [sessionId]
    );

    const session = Array.isArray(rows) ? (rows[0] as any) : null;

    if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const [result] = await db.query(`DELETE FROM sessions WHERE id = ?`, [sessionId]);

    const affectedRows = (result as any)?.affectedRows ?? 0;

    if (affectedRows === 0) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    try {
        const reqCtx = await getRequestAuditContext();

        await writeAuditLog({
            actor: currentUser
                ? {
                    id: currentUser.id,
                    email: currentUser.email,
                    name: currentUser.full_name,
                }
                : undefined,
            action: AuditAction.SESSION_DELETED,
            entityType: "session",
            entityId: session.id,
            targetDate: String(session.session_date).slice(0, 10),
            summary: `Deleted session ${session.id}`,
            before: {
                id: session.id,
                session_date: session.session_date,
                room_id: session.room_id,
                clinician_id: session.clinician_id,
                session_type: session.session_type,
                slot: session.slot,
                status: session.status,
                notes: session.notes,
            },
            after: null,
            meta: {
                room_id: session.room_id,
                clinician_id: session.clinician_id,
            },
            ipAddress: reqCtx.ipAddress,
            userAgent: reqCtx.userAgent,
        });
    } catch (error) {
        console.error("[AUDIT_LOG_FAILED][SESSION_DELETED]", error);
    }

    return NextResponse.json({ ok: true });
}