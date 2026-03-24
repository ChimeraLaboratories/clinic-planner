import { NextResponse } from "next/server";
import { getCurrentUserFromCookies, toPublicUser } from "@/lib/auth";

export async function GET() {
    try {
        const user = await getCurrentUserFromCookies();

        if (!user) {
            return NextResponse.json(
                { authenticated: false, user: null },
                { status: 401 }
            );
        }

        return NextResponse.json({
            authenticated: true,
            user: toPublicUser(user),
        });
    } catch (error) {
        console.error("GET /planner/api/me failed", error);
        return NextResponse.json(
            { authenticated: false, user: null },
            { status: 500 }
        );
    }
}