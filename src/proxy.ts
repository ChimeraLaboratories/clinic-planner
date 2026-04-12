import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "planner_session";

export function proxy(req: NextRequest) {
    const { pathname, search } = req.nextUrl;

    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authed = !!token;

    const isLoginPath =
        pathname === "/login" || pathname === "/planner/login";

    const isAuthApiPath =
        pathname === "/planner/api/login" ||
        pathname === "/planner/api/logout";

    const isPlannerApiPath = pathname.startsWith("/planner/api/");

    // Allow auth endpoints through
    if (isAuthApiPath) {
        return NextResponse.next();
    }

    // Protect API routes with 401 instead of redirect
    if (isPlannerApiPath) {
        if (!authed) {
            return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
        }
        return NextResponse.next();
    }

    // If not logged in, block everything except login pages
    if (!authed && !isLoginPath) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("next", `${pathname}${search}`);
        return NextResponse.redirect(loginUrl);
    }

    // If already logged in, stop access to login page
    if (isLoginPath && authed) {
        return NextResponse.redirect(new URL("/planner", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next|favicon.ico|.*\\..*).*)",
    ],
};