"use client";

import { useEffect, useState } from "react";

type PreferencesForm = {
    default_calendar_view: string;
    week_start_day: string;
    theme: string;
    compact_view: number;
    show_weekends: number;
    date_format: string;
    time_format: string;
};

export default function PreferencesSettingsPage() {
    const [form, setForm] = useState<PreferencesForm>({
        default_calendar_view: "month",
        week_start_day: "monday",
        theme: "system",
        compact_view: 0,
        show_weekends: 1,
        date_format: "dd/MM/yyyy",
        time_format: "HH:mm",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

    useEffect(() => {
        fetch("/planner/api/me/preferences")
            .then((res) => res.json())
            .then((data) => {
                setForm({
                    default_calendar_view: data.default_calendar_view ?? "month",
                    week_start_day: data.week_start_day ?? "monday",
                    theme: data.theme ?? "system",
                    compact_view: data.compact_view ?? 0,
                    show_weekends: data.show_weekends ?? 1,
                    date_format: data.date_format ?? "dd/MM/yyyy",
                    time_format: data.time_format ?? "HH:mm",
                });
            })
            .finally(() => setLoading(false));
    }, []);

    async function handleSave() {
        setSaving(true);
        setMessage("");

        if(!form.default_calendar_view) {
            setMessage("Default calendar view is required.");
            setMessageType("error");
            return;
        }
        if(!form.week_start_day) {
            setMessage("Week start day is required.");
            setMessageType("error");
            return;
        }
        if(!form.theme) {
            setMessage("Theme is required.");
            setMessageType("error");
            return;
        }

        const res = await fetch("/planner/api/me/preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });

        if (!res.ok) {
            setMessage("Could not save preferences.");
            setSaving(false);
            setMessageType("error");
            return;
        }

        const updated = await res.json();

        setForm({
            default_calendar_view: updated.default_calendar_view ?? "month",
            week_start_day: updated.week_start_day ?? "monday",
            theme: updated.theme ?? "system",
            compact_view: updated.compact_view ?? 0,
            show_weekends: updated.show_weekends ?? 1,
            date_format: updated.date_format ?? "dd/MM/yyyy",
            time_format: updated.time_format ?? "HH:mm",
        });

        setMessage("Preferences saved.");
        setMessageType("success");
        setSaving(false);
    }

    if (loading) return <div className="p-6">Loading preferences…</div>;

    return (
        <div className="p-6 max-w-2xl">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Preferences
            </h1>

            <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">

                <label className="block">
                    <span className="text-sm font-medium">Week start day</span>
                    <select
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                        value={form.week_start_day}
                        onChange={(e) =>
                            setForm({ ...form, week_start_day: e.target.value })
                        }
                    >
                        <option value="monday">Monday</option>
                        <option value="sunday">Sunday</option>
                    </select>
                </label>

                <label className="block">
                    <span className="text-sm font-medium">Date format</span>
                    <select
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                        value={form.date_format}
                        onChange={(e) =>
                            setForm({ ...form, date_format: e.target.value })
                        }
                    >
                        <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                        <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                        <option value="yyyy-MM-dd">yyyy-MM-dd</option>
                    </select>
                </label>

                <label className="block">
                    <span className="text-sm font-medium">Time format</span>
                    <select
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                        value={form.time_format}
                        onChange={(e) =>
                            setForm({ ...form, time_format: e.target.value })
                        }
                    >
                        <option value="HH:mm">24 hour</option>
                        <option value="hh:mm a">12 hour</option>
                    </select>
                </label>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
                >
                    {saving ? "Saving…" : "Save preferences"}
                </button>

                {message && (
                    <div className={`rounded-lg px-3 py-2 text-sm ${
                        messageType === "success" ? "border border-green-200 bg-green-50 text-green-700"
                            : "border border-red-200 bg-red-50 text-red-700"}`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}