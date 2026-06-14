import {db} from "@/lib/db";

export type UserPreferences = {
    user_id: number;
    default_calendar_view: string;
    week_start_day: string;
    theme: string;
    compact_view: boolean;
    show_weekends: boolean;
    date_format: string;
    time_format: string;
}

export const DEFAULT_PREFERENCES = {
    default_calendar_view: "month",
    week_start_day: "monday",
    theme: "system",
    compact_view: false,
    show_weekends: true,
    date_format: "dd/MM/yyyy",
    time_format: "HH:mm:SSS",

};

export async function getUserPreferences(user_id: number) {
    const [rows] = await db.query(
        `SELECT *
        FROM user_preferences
        WHERE user_id = ?
        LIMIT 1`, [user_id]
    );

    const preferences = rows as UserPreferences[];

    return preferences[0] ?? null;
}

export async function createDefaultPreferences(userId: number) {
    await db.query(
        `
            INSERT INTO user_preferences (
                user_id,
                default_calendar_view,
                week_start_day,
                theme,
                compact_view,
                show_weekends
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            userId,
            DEFAULT_PREFERENCES.default_calendar_view,
            DEFAULT_PREFERENCES.week_start_day,
            DEFAULT_PREFERENCES.theme,
            DEFAULT_PREFERENCES.compact_view,
            DEFAULT_PREFERENCES.show_weekends,
            DEFAULT_PREFERENCES.date_format,
            DEFAULT_PREFERENCES.time_format,
        ]
    );

    return getUserPreferences(userId);
}

export async function updateUserPreferences(
    userId: number,
    preferences: Partial<UserPreferences>
) {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (preferences.default_calendar_view !== undefined) {
        updates.push("default_calendar_view = ?");
        values.push(preferences.default_calendar_view);
    }

    if (preferences.week_start_day !== undefined) {
        updates.push("week_start_day = ?");
        values.push(preferences.week_start_day);
    }

    if (preferences.theme !== undefined) {
        updates.push("theme = ?");
        values.push(preferences.theme);
    }

    if (preferences.compact_view !== undefined) {
        updates.push("compact_view = ?");
        values.push(preferences.compact_view ? 1 : 0);
    }

    if (preferences.show_weekends !== undefined) {
        updates.push("show_weekends = ?");
        values.push(preferences.show_weekends ? 1 : 0);
    }

    if (preferences.date_format !== undefined) {
        updates.push("date_format = ?");
        values.push(preferences.date_format);
    }

    if (preferences.time_format !== undefined) {
        updates.push("time_format = ?");
        values.push(preferences.time_format);
    }

    if (updates.length === 0) {
        return getUserPreferences(userId);
    }

    values.push(userId);

    await db.query(
        `
        UPDATE user_preferences
        SET ${updates.join(", ")},
            updated_at = NOW()
        WHERE user_id = ?
        `,
        values
    );

    return getUserPreferences(userId);
}