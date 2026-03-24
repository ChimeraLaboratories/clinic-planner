import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";
import jwt from "jsonwebtoken";
import type { UserRole } from "@/lib/permissions";

type UserRow = RowDataPacket & {
    id: number;
    email: string;
    display_name: string | null;
    full_name: string | null;
    role: string | null;
    is_active?: number | null;
};

export type CurrentUser = {
    id: number;
    email: string;
    display_name: string | null;
    full_name: string | null;
    role: UserRole;
};

type TokenPayload = {
    sub: number | string;
    email?: string;
};

function normalizeRole(role: unknown): UserRole {
    const value = String(role ?? "").trim().toUpperCase();

    if (value === "ADMIN" || value === "PLANNER" || value === "VIEWER") {
        return value as UserRole;
    }

    return "VIEWER";
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("planner_auth")?.value;

    console.log("[auth] planner_auth cookie exists:", !!token);

    if (!token) {
        console.log("[auth] no planner_auth cookie found");
        return null;
    }

    const secret = process.env.AUTH_SECRET;
    console.log("[auth] AUTH_SECRET exists:", !!secret);

    if (!secret) throw new Error("AUTH_SECRET is not set");

    let payload: TokenPayload;
    try {
        payload = jwt.verify(token, secret) as TokenPayload;
        console.log("[auth] jwt verified, payload:", payload);
    } catch (err) {
        console.log("[auth] jwt verify failed:", err);
        return null;
    }

    const userId = Number(payload.sub);
    console.log("[auth] parsed userId from token:", userId);

    if (!Number.isFinite(userId) || userId <= 0) {
        console.log("[auth] invalid token sub:", payload.sub);
        return null;
    }

    const [rows] = await db.query<UserRow[]>(
        `
        SELECT id, email, display_name, full_name, role, is_active
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId]
    );

    console.log("[auth] user rows found:", rows.length);
    console.log("[auth] first user row:", rows[0] ?? null);

    const row = rows[0];
    if (!row) {
        console.log("[auth] no user found for token sub");
        return null;
    }

    if (row.is_active === 0) {
        console.log("[auth] user is inactive");
        return null;
    }

    const currentUser: CurrentUser = {
        id: row.id,
        email: row.email,
        display_name: row.display_name,
        full_name: row.full_name,
        role: normalizeRole(row.role),
    };

    console.log("[auth] returning currentUser:", currentUser);

    return currentUser;
}