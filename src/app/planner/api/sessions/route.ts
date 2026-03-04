import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/app/planner/services/plannerService";
import {getWeekPatternFromYmd, patternToLabel} from "@/lib/WeekPattern";

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

    // If clinician_id not set, nothing to enforce
    if (!Number.isFinite(clinician_id)) return;

    const pattern = getWeekPatternFromYmd(session_date);
    const weekday = weekdayForDate(session_date);

    // Prefer pattern-specific rule, fallback to EVERY
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

    // If no rule exists at all, we allow (treat as "no restriction")
    if (!rule) return;

    // Hard block if Day Off or explicitly unavailable
    const unavailable =
        isDayOffActivity(rule.activity_code) ||
        Number(rule.is_available_shift ?? 1) === 0;

    if (unavailable) {
        const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][weekday];
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
        } = body;

        if (!session_date || !room_id) {
            return NextResponse.json({ error: "session_date and room_id are required" }, { status: 400 });
        }

        const clinicianIdNum =
            clinician_id === null || clinician_id === "" || clinician_id === undefined
                ? null
                : Number(clinician_id);

        // ✅ Enforce day rules if clinician selected
        if (clinicianIdNum != null) {
            await assertClinicianAvailableOrThrow({
                clinician_id: clinicianIdNum,
                session_date: String(session_date).slice(0, 10),
            });
        }

        await createSession({
            session_date,
            room_id: Number(room_id),
            clinician_id: clinicianIdNum,
            session_type,
            slot,
            status,
            notes,
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error: any) {
        if (error?.code === "SESSION_CONFLICT") {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (error?.code === "CLINICIAN_NOT_AVAILABLE_SHIFT") {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }

        if (error?.code === "ER_DUP_ENTRY") {
            return NextResponse.json({ error: "Session already exists for this room/date/slot" }, { status: 409 });
        }

        console.error("Create session error:", error);
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
}