"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Clinician = {
    id: number;
    full_name: string;
    display_name: string;
    role_code: number;
    grade_code: number;
    GOC_number: string | null;
    is_supervisor: number;
    is_active: number;
};

export default function CliniciansTableClient({ clinicians }: { clinicians: Clinician[] }) {
    const router = useRouter();
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const roleLabel = (rc: number) => (rc === 1 ? "OO" : rc === 2 ? "CLO" : String(rc));
    const gradeLabel = (gc: number) => (gc === 1 ? "Registered" : gc === 2 ? "Pre-Reg" : String(gc));

    async function toggleActive(c: Clinician) {
        setTogglingId(c.id);
        try {
            const res = await fetch(`/planner/api/clinicians/${c.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: c.is_active ? 0 : 1 }),
            });

            if (!res.ok) {
                const msg = await res.json().catch(() => null);
                alert(msg?.error ?? "Failed to update clinician");
                return;
            }

            router.refresh();
        } finally {
            setTogglingId(null);
        }
    }

    return (
        <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-slate-300">
                <tr>
                    <th className="text-left p-3">Display</th>
                    <th className="text-left p-3">Full name</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">Grade</th>
                    <th className="text-left p-3">Supervisor</th>
                    <th className="text-left p-3">Active</th>
                    <th className="text-right p-3">Actions</th>
                </tr>
                </thead>

                <tbody>
                {clinicians.map((c) => (
                    <tr
                        key={c.id}
                        className="border-t border-gray-200 dark:border-slate-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-900/60 transition"
                        onClick={() => router.push(`/planner/clinicians/${c.id}/day-rules`)}
                        title="Open day rules"
                    >
                        <td className="p-3 font-medium text-gray-900 dark:text-slate-100">{c.display_name}</td>
                        <td className="p-3 text-gray-700 dark:text-slate-300">{c.full_name}</td>
                        <td className="p-3 text-gray-900 dark:text-slate-200">{roleLabel(c.role_code)}</td>
                        <td className="p-3 text-gray-900 dark:text-slate-200">{gradeLabel(c.grade_code)}</td>
                        <td className="p-3 text-gray-900 dark:text-slate-200">{c.is_supervisor ? "Yes" : "No"}</td>

                        <td className="p-3">
                            <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                    c.is_active
                                        ? "bg-green-100 text-green-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                                        : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                            >
                                {c.is_active ? "Active" : "Inactive"}
                            </span>
                        </td>

                        <td className="p-3 text-right">
                            <div className="inline-flex items-center gap-3">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleActive(c);
                                    }}
                                    disabled={togglingId === c.id}
                                    className={`text-xs px-2 py-1 rounded border disabled:opacity-50 ${
                                        c.is_active
                                            ? "border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-900"
                                            : "border-green-300 dark:border-emerald-900/60 text-green-700 dark:text-emerald-200 hover:bg-green-50 dark:hover:bg-emerald-950/30"
                                    }`}
                                >
                                    {togglingId === c.id
                                        ? "Saving…"
                                        : c.is_active
                                            ? "Deactivate"
                                            : "Activate"}
                                </button>

                                <Link
                                    href={`/planner/clinicians/${c.id}`}
                                    className="text-blue-600 dark:text-blue-300 hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Edit
                                </Link>

                                <Link
                                    href={`/planner/clinicians/${c.id}/day-rules`}
                                    className="text-blue-600 dark:text-blue-300 hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Day rules
                                </Link>
                            </div>
                        </td>
                    </tr>
                ))}

                {clinicians.length === 0 && (
                    <tr>
                        <td className="p-6 text-gray-500 dark:text-slate-400" colSpan={7}>
                            No clinicians found.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
}