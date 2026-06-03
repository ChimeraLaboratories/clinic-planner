import {AuditLog} from "@/app/planner/admin/audit/types";
import {AuditActionBadge} from "@/app/planner/admin/audit/components/AuditActionBadge";

type AuditTableProps = {
    logs: AuditLog[];
    onViewDetails: (log: AuditLog) => void;
};

export function AuditTable({logs, onViewDetails, }: AuditTableProps) {
    return (
        <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
            <tr>
                <th className="text-left px-4 py-3">Date Changed</th>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Area</th>
                <th className="text-left px-4 py-3">Clinic Date</th>
                <th className="text-left px-4 py-3">Summary</th>
                <th className="text-left px-4 py-3">Details</th>
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
                    <td className="px-4 py-3">
                        <AuditActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3">{log.entity_type}</td>
                    <td className="px-4 py-3">{log.target_date || "-"}</td>
                    <td className="px-4 py-3">{log.summary || "-"}</td>
                    <td className="px-4 py-3">
                        <button
                            onClick={() => onViewDetails(log)}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900">
                            View Details
                        </button>
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
    )
}