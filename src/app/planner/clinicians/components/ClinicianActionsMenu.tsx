"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Clinician } from "../types";

export default function ClinicianActionsMenu({ clinician }: { clinician: Clinician }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    async function toggleActive() {
        setSaving(true);

        try {
            const res = await fetch(`/planner/api/clinicians/${clinician.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: clinician.is_active ? 0 : 1 }),
            });

            if (!res.ok) {
                const msg = await res.json().catch(() => null);
                alert(msg?.error ?? "Failed to update clinician");
                return;
            }

            router.refresh();
        } finally {
            setSaving(false);
            setOpen(false);
        }
    }

    return (
        <div className="relative inline-block text-left">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="rounded-lg px-3 py-1 text-lg font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
                ...
            </button>

            {open && (
                <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950">
                    <Link href={`/planner/clinicians/${clinician.id}`} className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900">
                        Edit profile
                    </Link>

                    <Link href={`/planner/clinicians/${clinician.id}/day-rules`} className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900">
                        Manage day rules
                    </Link>

                    <Link href={`/planner/clinicians/${clinician.id}/holidays`} className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900">
                        Manage holidays
                    </Link>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    <button
                        type="button"
                        onClick={toggleActive}
                        disabled={saving}
                        className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-950/30"
                    >
                        {saving ? "Saving..." : clinician.is_active ? "Deactivate" : "Activate"}
                    </button>
                </div>
            )}
        </div>
    );
}