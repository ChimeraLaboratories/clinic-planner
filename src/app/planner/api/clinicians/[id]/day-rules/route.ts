import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Pattern = "W1" | "W2";

function isValidISODate(s: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isValidTimeOrNull(t: any): t is string | null {
    if (t === null) return true;
    if (typeof t !== "string") return false;
    return /^\d{2}:\d{2}:\d{2}$/.test(t);
}

function normalizePattern(input: any): Pattern {
    const s = String(input).trim().toUpperCase();
    if (s === "1" || s === "A" || s === "ODD" || s === "W1" || s === "WEEK1") return "W1";
    if (s === "2" || s === "B" || s === "EVEN" || s === "W2" || s === "WEEK2") return "W2";
    return "W1";
}

function computeIsAvailableShift(activity_code: string | null | undefined): number {
    const code = String(activity_code ?? "").trim().toUpperCase();
    const NOT_AVAILABLE = new Set(["D/O", "SG"]);
    if (!code) return 0;
    if (NOT_AVAILABLE.has(code)) return 0;
    return 1;
}

/**
 * GET /planner/api/clinicians/:id/day-rules?date=YYYY-MM-DD&pattern=W1|W2
 * Returns the weekly set (one per weekday) for that pattern effective at the given date.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await ctx.params;
        const clinicianId = Number(id);

        if (!Number.isFinite(clinicianId)) {
            return NextResponse.json({ error: "Invalid clinician id" }, { status: 400 });
        }

        const url = new URL(req.url);
        const dateParam = url.searchParams.get("date");
        const patternParam = url.searchParams.get("pattern");

        const date = dateParam && isValidISODate(dateParam) ? dateParam : new Date().toISOString().slice(0, 10);
        const pattern: Pattern = normalizePattern(patternParam);

        // One effective rule per weekday (0-6) FOR THE REQUESTED PATTERN
        const sql = `
            SELECT r.*
            FROM clinician_day_rule r
                     JOIN (
                SELECT weekday, MAX(effective_from) AS max_from
                FROM clinician_day_rule
                WHERE clinician_id = ?
                  AND is_active = 1
                  AND pattern_code = ?
                  AND effective_from <= ?
                  AND (effective_to IS NULL OR effective_to >= ?)
                GROUP BY weekday
            ) pick
                          ON pick.weekday = r.weekday AND pick.max_from = r.effective_from
            WHERE r.clinician_id = ?
              AND r.is_active = 1
              AND r.pattern_code = ?
            ORDER BY r.weekday;
        `;

        const [rows] = await db.query(sql, [clinicianId, pattern, date, date, clinicianId, pattern]);

        const [rooms] = await db.query(
            `
                SELECT id, name
                FROM rooms
                ORDER BY name
            `
        );

        const byWeekday = new Map<number, any>();
        for (const r of rows as any[]) byWeekday.set(Number(r.weekday), r);

        const weekly = Array.from({ length: 7 }, (_, weekday) => {
            const r = byWeekday.get(weekday);
            return {
                weekday,
                activity_code: r?.activity_code ?? "UNSET",
                start_time: r?.start_time ?? null,
                end_time: r?.end_time ?? null,
                note: r?.note ?? null,
                effective_from: r?.effective_from ?? null,
                effective_to: r?.effective_to ?? null,
                pattern_code: r?.pattern_code ?? pattern,
                id: r?.id ?? null,
                room_id: r?.room_id ?? null,
                room_allocation_mode: r?.room_allocation_mode ?? "AUTO",
            };
        });

        return NextResponse.json({ clinician_id: clinicianId, date, pattern, weekly, rooms });
    } catch (e: any) {
        console.error("[day-rules GET] error:", e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

type IncomingRule = {
    id?: number | null;
    weekday: number;
    activity_code: string;
    start_time: string | null;
    end_time: string | null;
    note: string | null;
    room_id?: number | null;
    room_allocation_mode?: "AUTO" | "FIXED";
};

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
    let conn: any;

    try {
        const { id } = await ctx.params;
        const clinicianId = Number(id);

        if (!Number.isFinite(clinicianId)) {
            return NextResponse.json({ error: "Invalid clinician id" }, { status: 400 });
        }

        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

        const mode = String(body.mode ?? "").trim().toUpperCase(); // "UPDATE_EXISTING" | (blank => legacy insert-new)
        const effectiveFrom = String(body.effectiveFrom ?? "");
        const rules = body.rules as IncomingRule[];
        const pattern: Pattern = normalizePattern(body.pattern ?? "W1");

        if (!isValidISODate(effectiveFrom)) {
            return NextResponse.json({ error: "effectiveFrom must be YYYY-MM-DD" }, { status: 400 });
        }

        if (!Array.isArray(rules) || rules.length !== 7) {
            return NextResponse.json({ error: "rules must be an array of 7 items (weekday 0-6)" }, { status: 400 });
        }

        // Validate weekdays unique 0-6, and fields
        const seen = new Set<number>();
        for (const r of rules) {
            const weekday = Number(r.weekday);

            if (!Number.isFinite(weekday) || weekday < 0 || weekday > 6) {
                return NextResponse.json({ error: "weekday must be 0-6" }, { status: 400 });
            }
            if (seen.has(weekday)) {
                return NextResponse.json({ error: "duplicate weekday in rules" }, { status: 400 });
            }
            seen.add(weekday);

            const activityCode = String(r.activity_code ?? "").trim();
            if (!activityCode) {
                return NextResponse.json({ error: "activity_code is required for each weekday" }, { status: 400 });
            }

            if (!isValidTimeOrNull((r as any).start_time ?? null) || !isValidTimeOrNull((r as any).end_time ?? null)) {
                return NextResponse.json({ error: "start_time/end_time must be HH:MM:SS or null" }, { status: 400 });
            }

            const note = (r as any).note ?? null;
            if (note !== null && typeof note !== "string") {
                return NextResponse.json({ error: "note must be string or null" }, { status: 400 });
            }
        }

        conn = await db.getConnection();
        await conn.beginTransaction();

        // ✅ NEW BEHAVIOUR: update existing rows (no new rows created) when mode=UPDATE_EXISTING
        if (mode === "UPDATE_EXISTING") {
            for (const r of rules) {
                const weekday = Number(r.weekday);
                const activity = String(r.activity_code).trim();
                const is_available_shift = computeIsAvailableShift(activity);
                const room_id = r.room_id ?? null;
                const room_allocation_mode = r.room_allocation_mode ?? "AUTO";

                // If we have an id, update that exact row.
                if (r.id !== null && r.id !== undefined) {
                    await conn.query(
                        `
                            UPDATE clinician_day_rule
                            SET activity_code = ?,
                                start_time = ?,
                                end_time = ?,
                                note = ?,
                                is_available_shift = ?,
                                room_id = ?,
                                room_allocation_mode = ?
                            WHERE id = ?
                              AND clinician_id = ?
                              AND pattern_code = ?
                              AND is_active = 1
                                LIMIT 1
                        `,
                        [
                            activity,
                            r.start_time ?? null,
                            r.end_time ?? null,
                            r.note ?? null,
                            is_available_shift,
                            room_id,
                            room_allocation_mode,
                            Number(r.id),
                            clinicianId,
                            pattern,
                        ]
                    );
                    continue;
                }

                // If no id (e.g. was UNSET / no row in DB), try to find an existing row for this effective_from then update it,
                // otherwise insert a new row for that weekday/effective_from.
                const [existing] = await conn.query(
                    `
                        SELECT id
                        FROM clinician_day_rule
                        WHERE clinician_id = ?
                          AND weekday = ?
                          AND pattern_code = ?
                          AND effective_from = ?
                          AND is_active = 1
                        ORDER BY id DESC
                            LIMIT 1
                    `,
                    [clinicianId, weekday, pattern, effectiveFrom]
                );

                const existingId = (existing as any[])?.[0]?.id ? Number((existing as any[])?.[0]?.id) : null;

                if (existingId) {
                    await conn.query(
                        `
                            UPDATE clinician_day_rule
                            SET activity_code = ?,
                                start_time = ?,
                                end_time = ?,
                                note = ?,
                                is_available_shift = ?,
                                room_id = ?,
                                room_allocation_mode = ?
                            WHERE id = ?
                              AND clinician_id = ?
                              AND pattern_code = ?
                              AND is_active = 1
                                LIMIT 1
                        `,
                        [
                            activity,
                            r.start_time ?? null,
                            r.end_time ?? null,
                            r.note ?? null,
                            is_available_shift,
                            room_id,
                            room_allocation_mode,
                            existingId,
                            clinicianId,
                            pattern,
                        ]
                    );
                } else {
                    await conn.query(
                        `
                            INSERT INTO clinician_day_rule
                            (clinician_id, weekday, pattern_code, activity_code, start_time, end_time, effective_from, effective_to, note, is_available_shift, room_id, room_allocation_mode, is_active)
                            VALUES
                                (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, 1)
                        `,
                        [
                            clinicianId,
                            weekday,
                            pattern,
                            activity,
                            r.start_time ?? null,
                            r.end_time ?? null,
                            effectiveFrom,
                            r.note ?? null,
                            is_available_shift,
                            room_id,
                            room_allocation_mode,
                        ]
                    );
                }
            }

            await conn.commit();
            conn.release?.();
            return NextResponse.json({ ok: true });
        }

        // ✅ LEGACY BEHAVIOUR (unchanged): create a new weekly set effective from date (history preserved)
        await conn.query(
            `
                UPDATE clinician_day_rule
                SET effective_to = DATE_SUB(?, INTERVAL 1 DAY)
                WHERE clinician_id = ?
                  AND is_active = 1
                  AND pattern_code = ?
                  AND effective_from < ?
                  AND (effective_to IS NULL OR effective_to >= ?)
            `,
            [effectiveFrom, clinicianId, pattern, effectiveFrom, effectiveFrom]
        );

        const values: any[] = [];
        const rowsSql: string[] = [];

        for (const r of rules) {
            const activity = String(r.activity_code).trim();
            const is_available_shift = computeIsAvailableShift(activity);
            const room_id = r.room_id ?? null;
            const room_allocation_mode = r.room_allocation_mode ?? "AUTO";

            rowsSql.push("(?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, 1)");
            values.push(
                clinicianId,
                Number(r.weekday),
                pattern,
                activity,
                r.start_time ?? null,
                r.end_time ?? null,
                effectiveFrom,
                r.note ?? null,
                is_available_shift,
                room_id,
                room_allocation_mode
            );
        }

        await conn.query(
            `
                INSERT INTO clinician_day_rule
                (clinician_id, weekday, pattern_code, activity_code, start_time, end_time, effective_from, effective_to, note, is_available_shift, room_id, room_allocation_mode, is_active)
                VALUES ${rowsSql.join(",")}
            `,
            values
        );

        await conn.commit();
        conn.release?.();
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        try {
            await conn?.rollback?.();
            conn?.release?.();
        } catch {}

        console.error("[day-rules PUT] error:", e);

        if (String(e?.code) === "ER_DUP_ENTRY") {
            return NextResponse.json(
                {
                    error:
                        "Rules already exist for this clinician, pattern, and effective-from date. Pick a different effective date.",
                },
                { status: 409 }
            );
        }

        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}