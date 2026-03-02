import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // ✅ change this import to your actual db helper

function isValidISODate(s: string) {
    // Basic YYYY-MM-DD check (enough for API guardrails)
    return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isValidTimeOrNull(t: any): t is string | null {
    if (t === null) return true;
    if (typeof t !== "string") return false;
    // Accept "HH:MM:SS" (mysql TIME)
    return /^\d{2}:\d{2}:\d{2}$/.test(t);
}

function computeIsAvailableShift(activity_code: string | null | undefined): number {
    const code = String(activity_code ?? "").trim().toUpperCase();

    // treat these as NOT available
    const NOT_AVAILABLE = new Set(["D/O", "SG"]);

    if (!code) return 0;                 // no code -> not available (or choose 1 if you prefer)
    if (NOT_AVAILABLE.has(code)) return 0;

    // ST / CL / OTHER / etc -> available
    return 1;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await ctx.params;

        const clinicianId = Number(id);
        if (!Number.isFinite(clinicianId)) {
            return NextResponse.json({ error: "Invalid clinician id" }, { status: 400 });
        }

        const url = new URL(req.url);
        const dateParam = url.searchParams.get("date");
        const date =
            dateParam && isValidISODate(dateParam)
                ? dateParam
                : new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

        // One effective rule per weekday (0-6)
        const sql = `
      SELECT r.*
      FROM clinician_day_rule r
      JOIN (
        SELECT weekday, MAX(effective_from) AS max_from
        FROM clinician_day_rule
        WHERE clinician_id = ?
          AND is_active = 1
          AND pattern_code = 'EVERY'
          AND effective_from <= ?
          AND (effective_to IS NULL OR effective_to >= ?)
        GROUP BY weekday
      ) pick
        ON pick.weekday = r.weekday
       AND pick.max_from = r.effective_from
      WHERE r.clinician_id = ?
        AND r.is_active = 1
        AND r.pattern_code = 'EVERY'
      ORDER BY r.weekday;
    `;

        const [rows] = await db.query(sql, [clinicianId, date, date, clinicianId]);

        // Normalize to always return 7 weekdays (even if missing in DB)
        const byWeekday = new Map<number, any>();
        for (const r of rows as any[]) byWeekday.set(Number(r.weekday), r);

        const weekly = Array.from({ length: 7 }, (_, weekday) => {
            const r = byWeekday.get(weekday);
            return {
                weekday,
                activity_code: r?.activity_code ?? "CLINIC",
                start_time: r?.start_time ?? null,
                end_time: r?.end_time ?? null,
                note: r?.note ?? null,
                effective_from: r?.effective_from ?? null,
                effective_to: r?.effective_to ?? null,
                pattern_code: r?.pattern_code ?? "EVERY",
                id: r?.id ?? null,
            };
        });

        return NextResponse.json({
            clinician_id: clinicianId,
            date,
            weekly,
        });
    } catch (e: any) {
        console.error("[day-rules GET] error:", e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

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

        const effectiveFrom = String(body.effectiveFrom ?? "");
        const rules = body.rules as any[];

        if (!isValidISODate(effectiveFrom)) {
            return NextResponse.json({ error: "effectiveFrom must be YYYY-MM-DD" }, { status: 400 });
        }

        if (!Array.isArray(rules) || rules.length !== 7) {
            return NextResponse.json({ error: "rules must be an array of 7 items (weekday 0-6)" }, { status: 400 });
        }

        // Validate weekdays unique 0-6
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

            if (!isValidTimeOrNull(r.start_time ?? null) || !isValidTimeOrNull(r.end_time ?? null)) {
                return NextResponse.json({ error: "start_time/end_time must be HH:MM:SS or null" }, { status: 400 });
            }

            const note = r.note ?? null;
            if (note !== null && typeof note !== "string") {
                return NextResponse.json({ error: "note must be string or null" }, { status: 400 });
            }
        }

        // Transaction
        conn = await db.getConnection();
        await conn.beginTransaction();

        // Close overlapping existing rules (EVERY pattern only)
        await conn.query(
            `
      UPDATE clinician_day_rule
      SET effective_to = DATE_SUB(?, INTERVAL 1 DAY)
      WHERE clinician_id = ?
        AND is_active = 1
        AND pattern_code = 'EVERY'
        AND effective_from < ?
        AND (effective_to IS NULL OR effective_to >= ?)
      `,
            [effectiveFrom, clinicianId, effectiveFrom, effectiveFrom]
        );

        // Insert the new weekly set
        const values: any[] = [];
        const rowsSql: string[] = [];

        for (const r of rules) {
            const activity = String(r.activity_code).trim();
            const is_available_shift = computeIsAvailableShift(activity);

            rowsSql.push("(?, ?, 'EVERY', ?, ?, ?, ?, NULL, ?, ?, 1)");
            values.push(
                clinicianId,
                Number(r.weekday),
                activity,
                r.start_time ?? null,
                r.end_time ?? null,
                effectiveFrom,
                r.note ?? null,
                is_available_shift
            );
        }

        await conn.query(
            `
                INSERT INTO clinician_day_rule
                (clinician_id, weekday, pattern_code, activity_code, start_time, end_time, effective_from, effective_to, note, is_available_shift, is_active)
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

        // Common: unique constraint clash on (clinician_id, weekday, pattern_code, effective_from)
        if (String(e?.code) === "ER_DUP_ENTRY") {
            return NextResponse.json(
                { error: "Rules already exist for this clinician and effective-from date. Pick a different effective date." },
                { status: 409 }
            );
        }

        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}