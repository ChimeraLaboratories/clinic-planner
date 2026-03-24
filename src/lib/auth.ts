import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

export type UserRole = "ADMIN" | "PLANNER" | "VIEWER";

export type AuthUser = {
    id: number;
    email: string;
    full_name: string | null;
    role: UserRole;
    job_role: string | null;
    is_active: number;
};

type SessionPayload = {
    sub: string;
    email: string;
    role: UserRole;
    name: string | null;
};

export const SESSION_COOKIE_NAME = "planner_session";

function getJwtSecret() {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
        throw new Error("AUTH_SECRET is not set");
    }
    return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
    return bcrypt.compare(password, passwordHash);
}

export async function signSession(user: AuthUser) {
    const payload: SessionPayload = {
        sub: String(user.id),
        email: user.email,
        role: user.role,
        name: user.full_name,
    };

    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(getJwtSecret());
}

export async function verifySessionToken(token: string) {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as SessionPayload;
}

export async function getSessionFromRequest(req: NextRequest) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    try {
        return await verifySessionToken(token);
    } catch {
        return null;
    }
}

export async function getCurrentUserFromCookies(): Promise<AuthUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    let session: SessionPayload;
    try {
        session = await verifySessionToken(token);
    } catch {
        return null;
    }

    const userId = Number(session.sub);
    if (!Number.isFinite(userId)) return null;

    const [rows] = await db.query(
        `
        SELECT id, email, full_name, role, is_active
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId]
    );

    const list = rows as AuthUser[];
    const user = list[0] ?? null;

    if (!user || !user.is_active) return null;
    return user;
}

export async function requireUser() {
    const user = await getCurrentUserFromCookies();
    if (!user) {
        throw new Error("UNAUTHENTICATED");
    }
    return user;
}

export function requireRole(user: AuthUser, allowed: UserRole[]) {
    if (!allowed.includes(user.role)) {
        throw new Error("FORBIDDEN");
    }
}

export function toPublicUser(user: AuthUser) {
    return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        job_role: user.job_role,
    };
}