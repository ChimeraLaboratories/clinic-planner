"use client";

import { useState } from "react";

type SecurityForm = {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
};

export default function SecuritySettingsPage() {
    const [form, setForm] = useState<SecurityForm>({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

    async function handleSave() {
        setSaving(true);
        setMessage("");

        const res = await fetch("/planner/api/me/password", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });

        const data = await res.json();

        if (!res.ok) {
            setMessage(data.error ?? "Could not update password.");
            setMessageType("error");
            setSaving(false);
            return;
        }

        setForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });

        setMessage("Password updated successfully.");
        setMessageType("success");
        setSaving(false);
    }

    return (
        <div className="p-6 max-w-2xl">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Security
            </h1>

            <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
                <label className="block">
                    <span className="text-sm font-medium">Current password</span>
                    <input
                        type="password"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                        value={form.currentPassword}
                        onChange={(e) =>
                            setForm({ ...form, currentPassword: e.target.value })
                        }
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-medium">New password</span>
                    <input
                        type="password"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                        value={form.newPassword}
                        onChange={(e) =>
                            setForm({ ...form, newPassword: e.target.value })
                        }
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-medium">Confirm new password</span>
                    <input
                        type="password"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                        value={form.confirmPassword}
                        onChange={(e) =>
                            setForm({ ...form, confirmPassword: e.target.value })
                        }
                    />
                </label>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
                >
                    {saving ? "Saving…" : "Change password"}
                </button>

                {message && (
                    <p
                        className={`rounded-lg px-3 py-2 text-sm ${
                            messageType === "success"
                                ? "border border-green-200 bg-green-50 text-green-700"
                                : "border border-red-200 bg-red-50 text-red-700"
                        }`}
                    >
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}