import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

import { db } from "@/lib/db";
// swap this import to your actual auth helper if named differently
import { canManageUsers } from "@/lib/permissions";
import {getCurrentUserFromCookies} from "@/lib/auth";

type Role = "ADMIN" | "PLANNER" | "VIEWER";

type UserRow = RowDataPacket & {
    id: number;
    email: string;
    full_name: string | null;
    role: Role;
    is_active: number;
    created_at: string;
    updated_at: string;
};

function isValidRole(value: unknown): value is Role {
    return value === "ADMIN" || value === "PLANNER" || value === "VIEWER";
}

export async function GET(req: NextRequest) {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser || !canManageUsers(currentUser.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const search = req.nextUrl.searchParams.get("search")?.trim() ?? "";

    let sql = `
        SELECT
            id,
            email,
            full_name,
            role,
            is_active,
            created_at,
            updated_at
        FROM users
    `;
    const params: any[] = [];

    if (search) {
        sql += `
            WHERE email LIKE ?
               OR full_name LIKE ?
               OR role LIKE ?
        `;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY is_active DESC, full_name ASC, email ASC`;

    const [rows] = await db.query<UserRow[]>(sql, params);

    return NextResponse.json({
        users: rows.map((u) => ({
            id: u.id,
            email: u.email,
            full_name: u.full_name,
            role: u.role,
            is_active: !!u.is_active,
            created_at: u.created_at,
            updated_at: u.updated_at,
        })),
    });
}

export async function POST(req: NextRequest) {
    const currentUser = await getCurrentUserFromCookies();
    console.log("admin users route currentUser:", currentUser);

    if (!currentUser || !canManageUsers(currentUser.role)) {
        console.log("forbidden because:", {
            hasUser: !!currentUser,
            role: currentUser?.role,
        });
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);

    const email = String(body?.email ?? "").trim().toLowerCase();
    const full_name = String(body?.full_name ?? "").trim() || null;
    const role = body?.role;
    const password = String(body?.password ?? "");
    const is_active = body?.is_active === false ? 0 : 1;

    if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (!isValidRole(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (!password || password.length < 8) {
        return NextResponse.json(
            { error: "Password must be at least 8 characters" },
            { status: 400 }
        );
    }

    const [existing] = await db.query<RowDataPacket[]>(
        `SELECT id FROM users WHERE email = ? LIMIT 1`,
        [email]
    );

    if (existing.length > 0) {
        return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await db.query<ResultSetHeader>(
        `
        INSERT INTO users (
            email,
            password_hash,
            full_name,
            role,
            is_active,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `,
        [email, password_hash, full_name, role, is_active]
    );

    return NextResponse.json({
        ok: true,
        id: result.insertId,
    });
}