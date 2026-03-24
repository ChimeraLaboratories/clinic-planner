import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";
import jwt from "jsonwebtoken";

type UserRow = RowDataPacket & {
    id: number;
    email: string;
    display_name: string | null;
    full_name: string | null;
    role: string | null;
};

type TokenPayload = {
    sub: number;
    email?: string;
};

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("planner_auth")?.value;

    if (!token) return null;

    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET is not set");

    let payload: TokenPayload;
    try {
        payload = jwt.verify(token, secret) as unknown as TokenPayload;
    } catch {
        return null;
    }

    const [rows] = await db.query<UserRow[]>(
        `
        SELECT id, email, display_name, full_name, role
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [payload.sub]
    );

    return rows[0] ?? null;
}