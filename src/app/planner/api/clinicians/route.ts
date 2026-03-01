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

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "1";

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
    WHERE (? = 1) OR is_active = 1
    ORDER BY is_active DESC, display_name, full_name
    `,
        [includeInactive ? 1 : 0]
    );

    return NextResponse.json(rows);
}

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);

    if (!body) {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const full_name = String(body.full_name ?? "").trim();
    const display_name = String(body.display_name ?? "").trim();
    const role_code = Number(body.role_code);
    const grade_code = Number(body.grade_code);
    const GOC_number =
        body.GOC_number == null || String(body.GOC_number).trim() === ""
            ? null
            : String(body.GOC_number).trim();
    const is_supervisor = body.is_supervisor ? 1 : 0;
    const is_active = body.is_active === 0 ? 0 : 1;

    if (!full_name) return NextResponse.json({ error: "full_name is required" }, { status: 400 });
    if (!display_name) return NextResponse.json({ error: "display_name is required" }, { status: 400 });
    if (![1, 2].includes(role_code)) return NextResponse.json({ error: "role_code must be 1 (OO) or 2 (CLO)" }, { status: 400 });
    if (![1, 2].includes(grade_code)) return NextResponse.json({ error: "grade_code must be 1 (Registered) or 2 (Pre-reg)" }, { status: 400 });

    const [result] = await db.query<ResultSetHeader>(
        `
    INSERT INTO clinicians
      (full_name, display_name, role_code, grade_code, GOC_number, is_supervisor, is_active)
    VALUES
      (?, ?, ?, ?, ?, ?, ?)
    `,
        [full_name, display_name, role_code, grade_code, GOC_number, is_supervisor, is_active]
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
}