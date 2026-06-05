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

export async function updateUserPreferences(userId: number, preferences: Partial<UserPreferences>) {
    await db.query(
        `UPDATE user_preferences
        SET
        default_calendar_view = ?,
        week_start_day = ?,
        theme = ?,
        compact_view = ?,
        show_weekends = ?,
        updated_at = NOW()
        WHERE user_id = ?`,
        [
            preferences.default_calendar_view,
            preferences.week_start_day,
            preferences.theme,
            preferences.compact_view,
            preferences.show_weekends,
            preferences.date_format,
            preferences.time_format,
            userId,
        ]
    );

    return getUserPreferences(userId);
}