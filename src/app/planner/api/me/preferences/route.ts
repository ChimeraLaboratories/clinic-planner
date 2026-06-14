import { NextResponse } from "next/server";
import { getCurrentUserFromCookies } from "@/lib/auth";
import {
    createDefaultPreferences,
    getUserPreferences,
    updateUserPreferences,
} from "@/lib/userPreferences";

const SUPPORTED_CALENDAR_VIEWS = ["month"] as const;
const SUPPORTED_WEEK_START_DAYS = ["monday", "sunday"] as const;
const SUPPORTED_THEMES = ["system", "light", "dark"] as const;
const SUPPORTED_DATE_FORMATS = ["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"] as const;
const SUPPORTED_TIME_FORMATS = ["12h", "24h"] as const;

type PreferenceUpdatePayload = {
    default_calendar_view?: string;
    week_start_day?: string;
    theme?: string;
    compact_view?: boolean;
    show_weekends?: boolean;
    date_format?: string;
    time_format?: string;
};

function errorResponse(message: string, status: number, details?: Record<string, string>) {
    return NextResponse.json(
        {
            success: false,
            error: message,
            details: details ?? null,
        },
        { status }
    );
}

function validatePreferences(body: PreferenceUpdatePayload) {
    const errors: Record<string, string> = {};

    if (
        body.default_calendar_view !== undefined &&
        !SUPPORTED_CALENDAR_VIEWS.includes(body.default_calendar_view as any)
    ) {
        errors.default_calendar_view = "Default calendar view must be month.";
    }

    if (
        body.week_start_day !== undefined &&
        !SUPPORTED_WEEK_START_DAYS.includes(body.week_start_day as any)
    ) {
        errors.week_start_day = "Week start day must be monday or sunday.";
    }

    if (
        body.theme !== undefined &&
        !SUPPORTED_THEMES.includes(body.theme as any)
    ) {
        errors.theme = "Theme must be system, light, or dark.";
    }

    if (
        body.compact_view !== undefined &&
        typeof body.compact_view !== "boolean"
    ) {
        errors.compact_view = "Compact view must be true or false.";
    }

    if (
        body.show_weekends !== undefined &&
        typeof body.show_weekends !== "boolean"
    ) {
        errors.show_weekends = "Show weekends must be true or false.";
    }

    if (
        body.date_format !== undefined &&
        !SUPPORTED_DATE_FORMATS.includes(body.date_format as any)
    ) {
        errors.date_format = "Date format must be dd/MM/yyyy, MM/dd/yyyy, or yyyy-MM-dd.";
    }

    if (
        body.time_format !== undefined &&
        !SUPPORTED_TIME_FORMATS.includes(body.time_format as any)
    ) {
        errors.time_format = "Time format must be 12h or 24h.";
    }

    return errors;
}

function buildPreferenceUpdate(body: PreferenceUpdatePayload) {
    const preferences: PreferenceUpdatePayload = {};

    if (body.default_calendar_view !== undefined) {
        preferences.default_calendar_view = body.default_calendar_view;
    }

    if (body.week_start_day !== undefined) {
        preferences.week_start_day = body.week_start_day;
    }

    if (body.theme !== undefined) {
        preferences.theme = body.theme;
    }

    if (body.compact_view !== undefined) {
        preferences.compact_view = body.compact_view;
    }

    if (body.show_weekends !== undefined) {
        preferences.show_weekends = body.show_weekends;
    }

    if (body.date_format !== undefined) {
        preferences.date_format = body.date_format;
    }

    if (body.time_format !== undefined) {
        preferences.time_format = body.time_format;
    }

    return preferences;
}

export async function GET() {
    try {
        const user = await getCurrentUserFromCookies();

        if (!user) {
            return errorResponse("No User Selected", 401);
        }

        let preferences = await getUserPreferences(user.id);

        if (!preferences) {
            preferences = await createDefaultPreferences(user.id);
        }

        return NextResponse.json({
            success: true,
            preferences,
        });
    } catch (error) {
        console.error("[preferences_get]", error);
        return errorResponse("Failed to load preferences", 500);
    }
}

export async function PUT(request: Request) {
    try {
        const user = await getCurrentUserFromCookies();

        if (!user) {
            return errorResponse("No User Selected", 401);
        }

        let body: PreferenceUpdatePayload;

        try {
            body = await request.json();
        } catch {
            return errorResponse("Invalid JSON body", 400);
        }

        const validationErrors = validatePreferences(body);

        if (Object.keys(validationErrors).length > 0) {
            return errorResponse("Invalid preference values", 400, validationErrors);
        }

        const preferencesToUpdate = buildPreferenceUpdate(body);

        if (Object.keys(preferencesToUpdate).length === 0) {
            return errorResponse("No valid preference fields provided", 400);
        }

        const preferences = await updateUserPreferences(user.id, preferencesToUpdate);

        return NextResponse.json({
            success: true,
            preferences,
        });
    } catch (error) {
        console.error("[preferences_put]", error);
        return errorResponse("Failed to update preferences", 500);
    }
}