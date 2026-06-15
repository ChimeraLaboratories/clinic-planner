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
    const warningCount = alerts.filter(
        (alert) => alert.severity === "critical" || alert.severity === "warning",
    ).length;

    const infoCount = alerts.filter((alert) => alert.severity === "info").length;

    return (
        <div
            className={[
                "fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-[1px] transition-opacity duration-300",
                open
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-0",
            ].join(" ")}
            onClick={onClose}
        >
            <aside
                className={[
                    "flex h-screen w-full max-w-[470px] flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-slate-800 dark:bg-slate-950",
                    open ? "translate-x-0" : "translate-x-full",
                ].join(" ")}
                onClick={(event) => event.stopPropagation()}
            >
                <AlertsDrawerHeader totalAlerts={alerts.length} onClose={onClose} />

                <AlertsDrawerFilters
                    allCount={alerts.length}
                    warningCount={warningCount}
                    infoCount={infoCount}
                />

                <div className="min-h-0 flex-1">
                    <AlertsDrawerList alerts={alerts} />
                </div>
            </aside>
        </div>
    );
}