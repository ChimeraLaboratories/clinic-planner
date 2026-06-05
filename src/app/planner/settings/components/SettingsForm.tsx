"use client"

import {useEffect, useState} from "react";

type UserPreferences = {
    default_calendar_view: string;
    week_start_day: string;
    theme: string;
    compact_view: boolean;
    show_weekends: boolean;
};

export function SettingsForm() {
    const [settings, setSettings] = useState<UserPreferences | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

   async function loadSettings() {
        const res = await fetch("/planner/api/me/preferences");
        const json = await res.json();
        setSettings(json);
    }

    async function saveSettings() {
        setSaving(true);

        await fetch("/planner/api/me/preferences", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(settings),
        });

        setSaving(false);
    }

    if (!settings) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <label>Theme</label>
                <select
                    value={settings.theme}
                    onChange={(e) =>
                setSettings({
                    ...settings,
                    theme: e.target.value,
                })}>

                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                </select>
            </div>

            <div>
                <label>Show Weekends</label>
                <input
                    type="checkbox"
                    checked={settings.show_weekends}
                    onChange={(e) =>
                setSettings({
                    ...settings,
                    show_weekends: e.target.checked,
                })}/>
            </div>

            <button onClick={saveSettings} disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
            </button>
        </div>
    )
}