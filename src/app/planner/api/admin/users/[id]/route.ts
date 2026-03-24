import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { db } from "@/lib/db";
// swap this import to your actual auth helper if named differently
import { canManageUsers } from "@/lib/permissions";
import {getCurrentUserFromCookies} from "@/lib/auth";

type Role = "ADMIN" | "PLANNER" | "VIEWER";

function isValidRole(value: unknown): value is Role {
    return value === "ADMIN" || value === "PLANNER" || value === "VIEWER";
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser || !canManageUsers(currentUser.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const userId = Number(id);

    if (!Number.isFinite(userId) || userId <= 0) {
        return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);

    const email = body?.email !== undefined ? String(body.email).trim().toLowerCase() : undefined;
    const full_name = body?.full_name !== undefined ? (String(body.full_name).trim() || null) : undefined;
    const role = body?.role;
    const password = body?.password !== undefined ? String(body.password) : undefined;
    const is_active =
        body?.is_active !== undefined ? (body.is_active ? 1 : 0) : undefined;

    const sets: string[] = [];
    const values: any[] = [];

    if (email !== undefined) {
        if (!email) {
            return NextResponse.json({ error: "Email cannot be empty" }, { status: 400 });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
        }

        const [existing] = await db.query<RowDataPacket[]>(
            `SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1`,
            [email, userId]
        );

        if (existing.length > 0) {
            return NextResponse.json({ error: "Another user already has that email" }, { status: 409 });
        }

        sets.push(`email = ?`);
        values.push(email);
    }

    if (full_name !== undefined) {
        sets.push(`full_name = ?`);
        values.push(full_name);
    }

    if (role !== undefined) {
        if (!isValidRole(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }
        sets.push(`role = ?`);
        values.push(role);
    }

    if (typeof password === "string") {
        if (password && password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        if (password) {
            const password_hash = await bcrypt.hash(password, 10);
            sets.push(`password_hash = ?`);
            values.push(password_hash);
        }
    }

    if (is_active !== undefined) {
        sets.push(`is_active = ?`);
        values.push(is_active);
    }

    if (sets.length === 0) {
        return NextResponse.json({ error: "No changes supplied" }, { status: 400 });
    }

    sets.push(`updated_at = NOW()`);

    values.push(userId);

    const [result] = await db.query<ResultSetHeader>(
        `UPDATE users SET ${sets.join(", ")} WHERE id = ?`,
        values
    );

    if (result.affectedRows === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
}