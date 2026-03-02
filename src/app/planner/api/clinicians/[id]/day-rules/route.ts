import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // ✅ change this import to your actual db helper

function isValidISODate(s: string) {
    // Basic YYYY-MM-DD check (enough for API guardrails)
    return /^\d{4}-\d{2}-\d{2}$/.test(s);
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