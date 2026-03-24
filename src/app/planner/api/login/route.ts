import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
    SESSION_COOKIE_NAME,
    signSession,
    toPublicUser,
    verifyPassword,
} from "@/lib/auth";

type UserRow = {
    id: number;
    email: string;
    full_name: string | null;
    role: "ADMIN" | "PLANNER" | "VIEWER";
    is_active: number;
    password_hash: string;
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const email = String(body?.email ?? "").trim().toLowerCase();
        const password = String(body?.password ?? "");

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const [rows] = await db.query(
            `
            SELECT id, email, full_name, role, is_active, password_hash
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email]
        );

        const users = rows as UserRow[];
        const user = users[0];

        if (!user || !user.is_active) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        const ok = await verifyPassword(password, user.password_hash);
        if (!ok) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        const token = await signSession(user);

        const res = NextResponse.json({
            ok: true,
            user: toPublicUser(user),
        });

        res.cookies.set({
            name: SESSION_COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return res;
    } catch (error) {
        console.error("POST /planner/api/login failed", error);
        return NextResponse.json(
            { error: "Unable to sign in" },
            { status: 500 }
        );
    }
}