/**
 * AuditDetailsDrawer.tsx
 *
 * Slide-out drawer used to display the full details of a selected
 * audit log entry, including before/after snapshots and metadata.
 */

import { AuditLog } from "@/app/planner/admin/audit/types";
import { formatAction } from "@/app/planner/admin/audit/components/AuditActionBadge";
import { JsonBlock } from "./JsonBlock";

type AuditDetailsDrawerProps = {
    selectedLog: AuditLog;
    onClose: () => void;
};

export function AuditDetailsDrawer({
                                       selectedLog,
                                       onClose,
                                   }: AuditDetailsDrawerProps) {
    return (
        // Full-screen overlay with right-hand details drawer
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
            <div className="h-full w-full max-w-2xl overflow-y-auto bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-6 shadow-xl">

                {/* Drawer header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                            Audit Entry Details
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Full information for this audit event.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm"
                    >
                        Close
                    </button>
                </div>

                {/* Audit event details */}
                <div className="mt-6 space-y-4 text-sm">
                    <div>
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                            User
                        </div>

                        {/* System-generated events may not have an actor */}
                        <div>
                            {selectedLog.actor_name || selectedLog.actor_email || "System"}
                        </div>
                    </div>

                    <div>
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                            Action
                        </div>
                        <div>{formatAction(selectedLog.action)}</div>
                    </div>

                    <div>
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                            Summary
                        </div>
                        <div>{selectedLog.summary || "-"}</div>
                    </div>

                    <div>
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                            IP Address
                        </div>
                        <div>{selectedLog.ip_address || "-"}</div>
                    </div>

                    {/* JSON snapshots captured when the audited action occurred */}
                    <JsonBlock title="Before" value={selectedLog.before_json} />
                    <JsonBlock title="After" value={selectedLog.after_json} />
                    <JsonBlock title="Metadata" value={selectedLog.meta_json} />
                </div>
            </div>
        </div>
    );
}