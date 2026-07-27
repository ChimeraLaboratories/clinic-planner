import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
    getWeekPatternFromYmd,
    patternToLabel,
} from "@/lib/WeekPattern";

type Slot = "FULL" | "AM" | "PM";

function conflictSlots(slot: Slot): Slot[] {
    return slot === "FULL"
        ? ["FULL", "AM", "PM"]
        : [slot, "FULL"];
}

function parseYMDToLocalDate(ymd: string) {
    const year = Number(ymd.slice(0, 4));
    const month = Number(ymd.slice(5, 7));
    const day = Number(ymd.slice(8, 10));

    return new Date(year, month - 1, day);
}

function weekdayForDate(ymd: string): number {
    return parseYMDToLocalDate(ymd).getDay();
}

function isDayOffActivity(code: unknown) {
    return String(code ?? "")
        .trim()
        .toUpperCase() === "D/O";
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const clinicianId = Number(body.clinician_id);
        const sessionDate = String(body.session_date ?? "").slice(0, 10);

        const slot = String(body.slot ?? "FULL") as Slot;

        if (!["FULL", "AM", "PM"].includes(slot)) {
            return NextResponse.json(
                {
                    valid: false,
                    error: {
                        code: "UNKNOWN",
                        title: "Invalid session slot",
                        message: "The selected session slot is not valid.",
                    },
                },
                { status: 400 },
            );
        }

        const isOvertime =
            body.is_overtime === true ||
            body.is_overtime === 1 ||
            body.is_overtime === "1";

        if (!Number.isFinite(clinicianId) || !sessionDate) {
            return NextResponse.json(
                {
                    valid: false,
                    error: {
                        code: "UNKNOWN",
                        title: "Unable to check clinician",
                        message:
                            "A clinician and session date are required.",
                    },
                },
                { status: 400 },
            );
        }

        const slotsToCheck = conflictSlots(slot);

        const [clinicianConflicts] = await db.query(
            `
        SELECT
            id,
            slot,
            room_id
        FROM sessions
        WHERE session_date = ?
          AND clinician_id = ?
          AND slot IN (${slotsToCheck.map(() => "?").join(",")})
          AND status <> 'CANCELLED'
        LIMIT 1
    `,
            [
                sessionDate,
                clinicianId,
                ...slotsToCheck,
            ],
        );

        const conflict = (clinicianConflicts as any[])?.[0];

        if (conflict) {
            return NextResponse.json(
                {
                    valid: false,
                    error: {
                        code: "ALREADY_ASSIGNED",
                        title: "Clinician is already assigned",
                        message:
                            `This clinician already has a ${conflict.slot} session ` +
                            `on ${sessionDate} in room ${conflict.room_id}.`,
                    },
                },
                { status: 409 },
            );
        }

        /*
         * Overtime sessions deliberately ignore clinician day rules.
         */
        if (isOvertime) {
            return NextResponse.json({
                valid: true,
            });
        }

        const pattern = getWeekPatternFromYmd(sessionDate);
        const weekday = weekdayForDate(sessionDate);

        const [rows] = await db.query(
            `
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
                  AND (
                      effective_to IS NULL
                      OR effective_to >= ?
                  )
                ORDER BY
                    (pattern_code = ?) DESC,
                    effective_from DESC
                LIMIT 1
            `,
            [
                clinicianId,
                weekday,
                pattern,
                sessionDate,
                sessionDate,
                pattern,
            ],
        );

        const rule = (rows as any[])?.[0];

        /*
         * No matching rule means there is no day-rule restriction.
         */
        if (!rule) {
            return NextResponse.json({
                valid: true,
            });
        }

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

            const patternLabel = patternToLabel(pattern);

            return NextResponse.json(
                {
                    valid: false,
                    error: {
                        code: "DAY_OFF",
                        title: "Clinician is unavailable",
                        message:
                            `This clinician is marked as Day Off or unavailable ` +
                            `on ${dayName} (${sessionDate}) for ${patternLabel}.`,
                    },
                },
                { status: 409 },
            );
        }

        return NextResponse.json({
            valid: true,
        });
    } catch (error) {
        console.error(
            "[VALIDATE_CLINICIAN_FAILED]",
            error,
        );

        return NextResponse.json(
            {
                valid: false,
                error: {
                    code: "UNKNOWN",
                    title: "Validation failed",
                    message:
                        "The clinician could not be checked. Please try again.",
                },
            },
            { status: 500 },
        );
    }
}