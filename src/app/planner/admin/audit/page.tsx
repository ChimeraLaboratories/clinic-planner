"use client";

import { useEffect, useState } from "react";

type AuditLog = {
    id: number;
    created_at: string;
    actor_name: string | null;
    actor_email: string | null;
    action: string;
    entity_type: string;
    target_date: string | null;
    summary: string | null;
};

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadLogs() {
            const res = await fetch("/planner/api/admin/audit");
            const data = await res.json();

            setLogs(data);
            setLoading(false);
        }

        loadLogs();
    }, []);

    return (
        <main className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                    Audit Log
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Review changes made across Clinic Planner.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {loading ? (
                    <div className="p-6 text-sm text-slate-600 dark:text-slate-300">
                        Loading audit logs…
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                        <tr>
                            <th className="text-left px-4 py-3">Date Changed</th>
                            <th className="text-left px-4 py-3">User</th>
                            <th className="text-left px-4 py-3">Action</th>
                            <th className="text-left px-4 py-3">Area</th>
                            <th className="text-left px-4 py-3">Clinic Date</th>
                            <th className="text-left px-4 py-3">Summary</th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {logs.map((log) => (
                            <tr key={log.id}>
                                <td className="px-4 py-3">
                                    {new Date(log.created_at).toLocaleString("en-GB")}
                                </td>
                                <td className="px-4 py-3">
                                    {log.actor_name || log.actor_email || "System"}
                                </td>
                                <td className="px-4 py-3">{log.action}</td>
                                <td className="px-4 py-3">{log.entity_type}</td>
                                <td className="px-4 py-3">{log.target_date || "-"}</td>
                                <td className="px-4 py-3">{log.summary || "-"}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </main>
    );
}