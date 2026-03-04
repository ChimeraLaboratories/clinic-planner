import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ymd = (v: any) => String(v ?? "").slice(0, 10);

async function getId(ctx: any): Promise<string | undefined> {
    const p = ctx?.params;
    if (!p) return undefined;
    if (typeof p.then === "function") {
        const resolved = await p;
        return resolved?.id;
    }
    return p?.id;
}

export async function POST(req: Request, ctx: any) {
    try {
        const idStr = await getId(ctx);
        const clinicianId = Number(idStr);

        const body = await req.json();
        const date = ymd(body?.date);
        const note = body?.note ?? null;

        if (!Number.isFinite(clinicianId) || clinicianId <= 0) {
            return NextResponse.json({ error: `Invalid clinician id: ${String(idStr)}` }, { status: 400 });
        }
        if (!date || date.length !== 10) {
            return NextResponse.json({ error: "date (YYYY-MM-DD) is required" }, { status: 400 });
        }

        await db.query(
            `INSERT INTO clinician_holiday (clinician_id, holiday_date, note)
             VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE note = VALUES(note)`,
            [clinicianId, date, note]
        );

        return NextResponse.json({ ok: true }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request, ctx: any) {
    try {
        const idStr = await getId(ctx);
        const clinicianId = Number(idStr);

        const url = new URL(req.url);
        const date = ymd(url.searchParams.get("date"));

        if (!Number.isFinite(clinicianId) || clinicianId <= 0) {
            return NextResponse.json({ error: `Invalid clinician id: ${String(idStr)}` }, { status: 400 });
        }
        if (!date || date.length !== 10) {
            return NextResponse.json({ error: "date (YYYY-MM-DD) is required" }, { status: 400 });
        }

        await db.query(
            `DELETE FROM clinician_holiday WHERE clinician_id = ? AND holiday_date = ?`,
            [clinicianId, date]
        );

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
    }
}