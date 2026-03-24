import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit/audit";
import { getRequestAuditContext } from "@/lib/audit/audit-request";
import { AuditAction } from "@/lib/audit/audit-actions";
import { getCurrentUserFromCookies } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const in_store_date = String(body.in_store_date ?? "").slice(0, 10);
        const clinician_id = Number(body.clinician_id);

        if (!/^\d{4}-\d{2}-\d{2}$/.test(in_store_date)) {
            return NextResponse.json({ error: "Invalid in_store_date" }, { status: 400 });
        }
        if (!Number.isFinite(clinician_id) || clinician_id <= 0) {
            return NextResponse.json({ error: "Invalid clinician_id" }, { status: 400 });
        }

        const currentUser = await getCurrentUserFromCookies();

        const [beforeRows] = await db.query(
            `
            SELECT in_store_date, clinician_id
            FROM supervisor_in_store
            WHERE in_store_date = ?
            LIMIT 1
            `,
            [in_store_date]
        );

        const before = Array.isArray(beforeRows) ? (beforeRows[0] as any) ?? null : null;

        await db.query(
            `
            INSERT INTO supervisor_in_store (in_store_date, clinician_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE clinician_id = VALUES(clinician_id)
            `,
            [in_store_date, clinician_id]
        );

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
                action: AuditAction.SUPERVISOR_IN_STORE_ADDED,
                entityType: "supervisor_in_store",
                entityId: in_store_date,
                targetDate: in_store_date,
                summary: `Set supervisor in store for ${in_store_date}`,
                before,
                after: {
                    in_store_date,
                    clinician_id,
                },
                meta: {
                    replaced_existing: Boolean(before),
                },
                ipAddress: reqCtx.ipAddress,
                userAgent: reqCtx.userAgent,
            });
        } catch (error) {
            console.error("[AUDIT_LOG_FAILED][SUPERVISOR_IN_STORE_ADDED]", error);
        }

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const date = String(url.searchParams.get("date") ?? "").slice(0, 10);
        const clinicianId = Number(url.searchParams.get("clinicianId"));

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return NextResponse.json({ error: "Invalid date" }, { status: 400 });
        }
        if (!Number.isFinite(clinicianId) || clinicianId <= 0) {
            return NextResponse.json({ error: "Invalid clinicianId" }, { status: 400 });
        }

        const currentUser = await getCurrentUserFromCookies();

        const [beforeRows] = await db.query(
            `
            SELECT in_store_date, clinician_id
            FROM supervisor_in_store
            WHERE in_store_date = ? AND clinician_id = ?
            LIMIT 1
            `,
            [date, clinicianId]
        );

        const before = Array.isArray(beforeRows) ? (beforeRows[0] as any) ?? null : null;

        await db.query(
            `DELETE FROM supervisor_in_store WHERE in_store_date=? AND clinician_id=?`,
            [date, clinicianId]
        );

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
                action: AuditAction.SUPERVISOR_IN_STORE_REMOVED,
                entityType: "supervisor_in_store",
                entityId: `${date}:${clinicianId}`,
                targetDate: date,
                summary: `Removed supervisor in store for ${date}`,
                before,
                after: null,
                meta: {
                    clinician_id: clinicianId,
                },
                ipAddress: reqCtx.ipAddress,
                userAgent: reqCtx.userAgent,
            });
        } catch (error) {
            console.error("[AUDIT_LOG_FAILED][SUPERVISOR_IN_STORE_REMOVED]", error);
        }

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
    }
}