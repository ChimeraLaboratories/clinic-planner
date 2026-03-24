import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "planner_session";

function getJwtSecret() {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
        throw new Error("AUTH_SECRET is not set");
    }
    return new TextEncoder().encode(secret);
}

async function isAuthenticated(req: NextRequest) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return false;

    try {
        await jwtVerify(token, getJwtSecret());
        return true;
    } catch {
        return false;
    }
}

export async function middleware(req: NextRequest) {
    const { pathname, search } = req.nextUrl;

    const isLoginPath = pathname === "/login";

    const isAuthApiPath =
        pathname === "/planner/api/login" ||
        pathname === "/planner/api/logout" ||
        pathname === "/planner/api/me";

    const isPlannerPagePath =
        pathname === "/planner" ||
        (pathname.startsWith("/planner/") && !pathname.startsWith("/planner/api/"));

    if (isAuthApiPath) {
        return NextResponse.next();
    }

    if (!isPlannerPagePath && !isLoginPath) {
        return NextResponse.next();
    }

    const authed = await isAuthenticated(req);

    if (isPlannerPagePath && !authed) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("next", `${pathname}${search}`);
        return NextResponse.redirect(loginUrl);
    }

    if (isLoginPath && authed) {
        return NextResponse.redirect(new URL("/planner", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/planner/:path*", "/login"],
};