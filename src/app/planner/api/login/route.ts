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
    job_role: string | null;
    is_active: number;
    password_hash: string;
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const email = String(body?.email ?? "").trim().toLowerCase();
        const password = String(body?.password ?? "");

        console.log("[login] request received");
        console.log("[login] email:", email);
        console.log("[login] DB_HOST:", process.env.DB_HOST);
        console.log("[login] DB_POST:", process.env.DB_PORT);
        console.log("[login] DB_NAME:", process.env.DB_NAME);
        console.log("[login] has DATABASE_URL:", !!process.env.DATABASE_URL);


        if (!email || !password) {
            console.log("[login] missing credentials");
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const [rows] = await db.query(
            `
            SELECT id, email, full_name, role, job_role, is_active, password_hash
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email]
        );

        const users = rows as UserRow[];
        const user = users[0];

        console.log("[login] user found:", !!user);
        console.log("[login] is_active:", user?.is_active ?? null);
        console.log("[login] has password hash:", !!user?.password_hash);

        if (!user || !user.is_active) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        const passwordOk = await verifyPassword(password, user.password_hash);
        console.log("[login] password match:", passwordOk);

        if (!passwordOk) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        const token = await signSession(user);
        console.log("[login] token created");

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

        console.log("[login] cookie set");
        return res;
    } catch (error) {
        console.error("[login] failed:", error);
        return NextResponse.json(
            { error: "Unable to sign in" },
            { status: 500 }
        );
    }
}