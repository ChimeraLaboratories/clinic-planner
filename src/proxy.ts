import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "planner_session";

export function proxy(req: NextRequest) {
    const { pathname, search } = req.nextUrl;

    const isLoginPath =
        pathname === "/login" || pathname === "/planner/login";

    const isAuthApiPath =
        pathname === "/planner/api/login" ||
        pathname === "/planner/api/logout";

    const isPlannerApiPath = pathname.startsWith("/planner/api/");

    const isPlannerPagePath =
        pathname === "/planner" ||
        (pathname.startsWith("/planner/") &&
            !pathname.startsWith("/planner/api/") &&
            pathname !== "/planner/login");

    if (isAuthApiPath) {
        return NextResponse.next();
    }

    if (isPlannerApiPath) {
        const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
        }
        return NextResponse.next();
    }

    if (!isPlannerPagePath && !isLoginPath) {
        return NextResponse.next();
    }

    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authed = !!token;

    if (isPlannerPagePath && !authed) {
        const loginUrl = new URL("/planner/login", req.url);
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