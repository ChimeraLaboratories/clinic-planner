import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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

        await db.query(
            `
      INSERT INTO supervisor_in_store (in_store_date, clinician_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE clinician_id = VALUES(clinician_id)
      `,
            [in_store_date, clinician_id]
        );

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

        await db.query(
            `DELETE FROM supervisor_in_store WHERE in_store_date=? AND clinician_id=?`,
            [date, clinicianId]
        );

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
    }
}