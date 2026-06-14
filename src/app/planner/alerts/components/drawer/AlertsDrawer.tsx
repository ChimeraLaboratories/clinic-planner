"use client";

import type { PlannerAlert } from "@/app/planner/types/alert";
import AlertsDrawerHeader from "./AlertsDrawerHeader";
import AlertsDrawerFilters from "./AlertsDrawerFilters";
import AlertsDrawerList from "./AlertsDrawerList";

type AlertsDrawerProps = {
    open: boolean;
    onClose: () => void;
    alerts: PlannerAlert[];
};

export default function AlertsDrawer({ open, onClose, alerts }: AlertsDrawerProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35">
            <aside className="flex h-screen w-full max-w-[430px] flex-col border-l border-slate-200 bg-white shadow-2xl">
                <AlertsDrawerHeader totalAlerts={alerts.length} onClose={onClose} />

                <AlertsDrawerFilters
                    allCount={alerts.length}
                    warningCount={alerts.filter((a) => a.severity === "critical" || a.severity === "warning").length}
                    infoCount={alerts.filter((a) => a.severity === "info").length}
                />

                <div className="min-h-0 flex-1">
                    <AlertsDrawerList alerts={alerts} />
                </div>
            </aside>
        </div>
    );
}