import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/app/planner/services/plannerService";
import { getWeekPatternFromYmd, patternToLabel } from "@/lib/WeekPattern";
import { writeAuditLog } from "@/lib/audit/audit";
import { getRequestAuditContext } from "@/lib/audit/audit-request";
import { AuditAction } from "@/lib/audit/audit-actions";
import { getCurrentUserFromCookies } from "@/lib/auth";

type Pattern = "W1" | "W2";

/** Parse YYYY-MM-DD safely to a local Date (no timezone drift). */
function parseYMDToLocalDate(ymd: string) {
    const y = Number(ymd.slice(0, 4));
    const m = Number(ymd.slice(5, 7));
    const d = Number(ymd.slice(8, 10));
    return new Date(y, m - 1, d);
}

function weekdayForDate(ymd: string): number {
    const d = parseYMDToLocalDate(ymd);
    return d.getDay(); // 0..6 (Sun..Sat) matches your DB weekday usage
}

function isDayOffActivity(code: any) {
    return String(code ?? "").trim().toUpperCase() === "D/O";
}

/**
 * Check clinician availability for date, using:
 * - specific pattern (W1/W2) first
 * - fallback to EVERY
 * - effective_from / effective_to window
 */
async function assertClinicianAvailableOrThrow(params: {
    clinician_id: number;
    session_date: string; // YYYY-MM-DD
}) {
    const { clinician_id, session_date } = params;

    if (!Number.isFinite(clinician_id)) return;

    const pattern = getWeekPatternFromYmd(session_date);
    const weekday = weekdayForDate(session_date);

    const sql = `
        SELECT
            activity_code,
            is_available_shift,
            pattern_code,
            effective_from,
            effective_to
        FROM clinician_day_rule
        WHERE clinician_id = ?
          AND weekday = ?
          AND is_active = 1
          AND pattern_code IN (?, 'EVERY')
          AND effective_from <= ?
          AND (effective_to IS NULL OR effective_to >= ?)
        ORDER BY
            (pattern_code = ?) DESC,
            effective_from DESC
            LIMIT 1
    `;

    const [rows] = await db.query(sql, [
        clinician_id,
        weekday,
        pattern,
        session_date,
        session_date,
        pattern,
    ]);

    const rule = (rows as any[])?.[0];

    // No rule = no restriction
    if (!rule) return;

    const unavailable =
        isDayOffActivity(rule.activity_code) ||
        Number(rule.is_available_shift ?? 1) === 0;

    if (unavailable) {
        const dayName = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ][weekday];

        const patLabel = patternToLabel(pattern);

        const err: any = new Error(
            `Clinician is marked as Day Off or is unavailable on ${dayName} (${session_date}) for ${patLabel}.`
        );
        err.code = "CLINICIAN_NOT_AVAILABLE_SHIFT";
        throw err;
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const {
            session_date,
            room_id,
            clinician_id,
            session_type = "ST",
            slot = "FULL",
            status = "DRAFT",
            notes = null,
            is_overtime = 0,
        } = body;

        if (!session_date || !room_id) {
            return NextResponse.json(
                { error: "session_date and room_id are required" },
                { status: 400 }
            );
        }

        const clinicianIdNum =
            clinician_id === null || clinician_id === "" || clinician_id === undefined
                ? null
                : Number(clinician_id);

        const roomIdNum = Number(room_id);
        const sessionDateYmd = String(session_date).slice(0, 10);
        const isOvertime =
            is_overtime === true ||
            is_overtime === 1 ||
            is_overtime === "1";

        // Only enforce day rules when NOT overtime
        if (!isOvertime && clinicianIdNum != null) {
            await assertClinicianAvailableOrThrow({
                clinician_id: clinicianIdNum,
                session_date: sessionDateYmd,
            });
        }

        const sessionId = await createSession({
            session_date: sessionDateYmd,
            room_id: roomIdNum,
            clinician_id: clinicianIdNum,
            session_type,
            slot,
            status,
            notes,
            is_overtime: isOvertime ? 1 : 0,
        });

        try {
            const currentUser = await getCurrentUserFromCookies();
            const reqCtx = await getRequestAuditContext();

            await writeAuditLog({
                actor: currentUser
                    ? {
                        id: currentUser.id,
                        email: currentUser.email,
                        name: currentUser.full_name,
                    }
                    : undefined,
                action: AuditAction.SESSION_CREATED,
                entityType: "session",
                entityId: sessionId,
                targetDate: sessionDateYmd,
                summary: `Created ${session_type} session in room ${roomIdNum}`,
                before: null,
                after: {
                    id: sessionId,
                    session_date: sessionDateYmd,
                    room_id: roomIdNum,
                    clinician_id: clinicianIdNum,
                    session_type,
                    slot,
                    status,
                    notes,
                    is_overtime: isOvertime ? 1 : 0,
                },
                meta: {
                    room_id: roomIdNum,
                    clinician_id: clinicianIdNum,
                    is_overtime: isOvertime ? 1 : 0,
                },
                ipAddress: reqCtx.ipAddress,
                userAgent: reqCtx.userAgent,
            });
        } catch (error) {
            console.error("[AUDIT_LOG_FAILED][SESSION_CREATED]", error);
        }

        return NextResponse.json(
            {
                success: true,
                is_overtime: isOvertime ? 1 : 0,
            },
            { status: 201 }
        );
    } catch (error: any) {
        if (error?.code === "SESSION_CONFLICT") {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (error?.code === "CLINICIAN_NOT_AVAILABLE_SHIFT") {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }

        if (error?.code === "ER_DUP_ENTRY") {
            return NextResponse.json(
                { error: "Session already exists for this room/date/slot" },
                { status: 409 }
            );
        }

        console.error("Create session error:", error);
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
}