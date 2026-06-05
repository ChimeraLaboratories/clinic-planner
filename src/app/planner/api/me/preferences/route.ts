import {getCurrentUser} from "@/lib/auth/getCurrentUser";
import {NextResponse} from "next/server";
import {createDefaultPreferences, getUserPreferences, updateUserPreferences} from "@/lib/userPreferences";
import {getCurrentUserFromCookies} from "@/lib/auth";

export async function GET() {
    try {
        const user = await getCurrentUserFromCookies();

        if (!user) {
            return NextResponse.json({ error: "No User Selected" }, { status: 401 });
        }

        let preferences = await getUserPreferences(user.id);

        if (!preferences) {
            preferences = await createDefaultPreferences(user.id);
        }

        return NextResponse.json(preferences);
    } catch (error) {
        console.error("[preferences_get]", error);
        return NextResponse.json(
            { error: "Failed to load preferences" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const user = await getCurrentUserFromCookies();

        if (!user) {
            return NextResponse.json({ error: "No User Selected" }, { status: 401 });
        }

        const body = await request.json();

        const preferences = await updateUserPreferences(user.id, {
            default_calendar_view: body.default_calendar_view,
            week_start_day: body.week_start_day,
            theme: body.theme,
            compact_view: body.compact_view,
            show_weekends: body.show_weekends,
            date_format: body.date_format,
            time_format: body.time_format,
        });

        return NextResponse.json(preferences);
    } catch (error) {
        console.error("[preferences_put]", error);
        return NextResponse.json(
            { error: "Failed to update preferences" },
            { status: 500 }
        );
    }
}