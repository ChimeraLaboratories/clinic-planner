import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { db } from "@/lib/db";

type ClinicianRow = RowDataPacket & {
    id: number;
    full_name: string;
    display_name: string;
    role_code: number;
    grade_code: number;
    GOC_number: string | null;
    is_supervisor: number;
    is_active: number;
};

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const clinicianId = Number(id);

    if (!Number.isFinite(clinicianId)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const [rows] = await db.query<ClinicianRow[]>(
        `
    SELECT
      id,
      full_name,
      display_name,
      role_code,
      grade_code,
      GOC_number,
      is_supervisor,
      is_active
    FROM clinicians
    WHERE id = ?
    LIMIT 1
    `,
        [clinicianId]
    );

    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const clinicianId = Number(id);

    if (!Number.isFinite(clinicianId)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Build dynamic update
    const fields: string[] = [];
    const values: any[] = [];

    const add = (field: string, value: any) => {
        fields.push(`${field} = ?`);
        values.push(value);
    };

    if (body.full_name !== undefined) add("full_name", String(body.full_name ?? "").trim());
    if (body.display_name !== undefined) add("display_name", String(body.display_name ?? "").trim());

    if (body.role_code !== undefined) add("role_code", Number(body.role_code));
    if (body.grade_code !== undefined) add("grade_code", Number(body.grade_code));

    if (body.GOC_number !== undefined) {
        const v = String(body.GOC_number ?? "").trim();
        add("GOC_number", v === "" ? null : v);
    }

    if (body.is_supervisor !== undefined) add("is_supervisor", body.is_supervisor ? 1 : 0);
    if (body.is_active !== undefined) add("is_active", body.is_active ? 1 : 0);

    if (!fields.length) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(clinicianId);

    const [result] = await db.query<ResultSetHeader>(
        `
    UPDATE clinicians
    SET ${fields.join(", ")}
    WHERE id = ?
    `,
        values
    );

    if (result.affectedRows === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
}