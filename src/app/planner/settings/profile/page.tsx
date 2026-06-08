"use client";

import { useEffect, useState } from "react";
import {router} from "next/client";
import {useRouter} from "next/navigation";

type ProfileForm = {
    full_name: string;
    email: string;
    job_role: string;
};

export default function ProfileSettingsPage() {
    const [form, setForm] = useState<ProfileForm>({
        full_name: "",
        email: "",
        job_role: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetch("/planner/api/me/profile")
            .then((res) => res.json())
            .then((data) => {
                const profile = Array.isArray(data) ? data[0] : data;

                setForm({
                    full_name: profile.full_name ?? "",
                    email: profile.email ?? "",
                    job_role: profile.job_role ?? "",
                });
            })
            .finally(() => setLoading(false));
    }, []);

    async function handleSave() {
        if (!form.full_name.trim()) {
            setMessage("Full Name is required");
            setMessageType("error");
            return;
        }
        if (!form.email.trim()) {
            setMessage("Email Address is required");
            setMessageType("error");
            return;
        }
        if (!form.email.includes("@")) {
            setMessage("Please enter a valid email address");
            setMessageType("error");
            return;
        }

        setSaving(true);
        setMessage("Profile saved.");
        setMessageType("success");

        const res = await fetch("/planner/api/me/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });

        if (!res.ok) {
            setMessage("Could not save profile.");
            setSaving(false);
            return;
        }

        const updated = await res.json();

        setForm({
            full_name: updated.full_name ?? "",
            email: updated.email ?? "",
            job_role: updated.job_role ?? "",
        });

        router.refresh();
        setMessage("Profile saved.");
        setSaving(false);
    }

    if (loading) return <div className="p-6">Loading profile…</div>;

    return (
        <div className="p-6 max-w-2xl">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Profile
            </h1>

            <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
                <label className="block">
                    <span className="text-sm font-medium">Full name</span>
                    <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                        value={form.full_name}
                        onChange={(e) =>
                            setForm({ ...form, full_name: e.target.value })
                        }
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-medium">Email</span>
                    <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                        value={form.email}
                        onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                        }
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-medium">Job role</span>
                    <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                        value={form.job_role}
                        onChange={(e) =>
                            setForm({ ...form, job_role: e.target.value })
                        }
                    />
                </label>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
                >
                    {saving ? "Saving…" : "Save profile"}
                </button>

                {message && (
                    <p className={`rounded-lg px-3 py-2 text-sm ${
                        messageType === "success"
                        ? "border border-green-200 bg-green-50 text-green-700"
                            : "border border-red-200 bg-red-50 text-red-700"
                    }`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}