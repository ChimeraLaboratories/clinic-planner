"use client";

import { useEffect, useState } from "react";

export type UserPreferences = {
    default_calendar_view: string;
    week_start_day: string;
    theme: string;
    compact_view: boolean;
    show_weekends: boolean;
    date_format: string;
    time_format: string;
};

const defaultPreferences: UserPreferences = {
    default_calendar_view: "month",
    week_start_day: "monday",
    theme: "system",
    compact_view: false,
    show_weekends: true,
    date_format: "dd/MM/yyyy",
    time_format: "HH:mm",
};

export function useUserPreferences() {
    const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPreferences() {
            try {
                const res = await fetch("/planner/api/me/preferences");

                if (!res.ok) {
                    setPreferences(defaultPreferences);
                    return;
                }

                const data = await res.json();

                setPreferences({
                    ...defaultPreferences,
                    ...data.preferences,
                    compact_view: Boolean(data.preferences.compact_view),
                    show_weekends: Boolean(data.preferences.show_weekends),
                });
            } catch {
                setPreferences(defaultPreferences);
            } finally {
                setLoading(false);
            }
        }

        loadPreferences();
    }, []);

    return {
        preferences,
        loading,
    };
}