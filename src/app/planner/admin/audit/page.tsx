"use client";

import { useEffect, useState } from "react";
import {AuditActionBadge, formatAction} from "@/app/planner/admin/audit/components/AuditActionBadge";
import {AuditLog} from "@/app/planner/admin/audit/types";
import {AuditDetailsDrawer} from "@/app/planner/admin/audit/components/AuditDetailsDrawer";
import {AuditFilters} from "@/app/planner/admin/audit/components/AuditFilters";
import {AuditTable} from "@/app/planner/admin/audit/components/AuditTable";

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [areaFilter, setAreaFilter] = useState("all");

    const filteredLogs = logs.filter((log) => {
        const searchText = `${log.summary ?? ""} ${log.actor_name ?? ""} ${
            log.actor_email ?? ""
        }`.toLowerCase();

        const matchesSearch = searchText.includes(search.toLowerCase());

        const matchesAction =
            actionFilter === "all" || log.action === actionFilter;

        const matchesArea =
            areaFilter === "all" || log.entity_type === areaFilter;

        return matchesSearch && matchesAction && matchesArea;
    });

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

            <AuditFilters
                search={search}
                actionFilter={actionFilter}
                areaFilter={areaFilter}
                onSearchChange={setSearch}
                onActionFilterChange={setActionFilter}
                onAreaFilterChange={setAreaFilter}
            />

            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {loading ? (
                    <div className="p-6 text-sm text-slate-600 dark:text-slate-300">
                        Loading audit logs…
                    </div>

                ) : (
                    <AuditTable logs={filteredLogs} onViewDetails={setSelectedLog}/>
                )}
            </div>
            {selectedLog && (
                <AuditDetailsDrawer selectedLog={selectedLog} onClose={() => setSelectedLog(null)} />
            )}
        </main>
    );
}