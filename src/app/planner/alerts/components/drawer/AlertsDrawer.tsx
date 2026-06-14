"use client";

import {PlannerAlert} from "@/app/planner/types/alert";
import AlertsDrawerHeader from "@/app/planner/alerts/components/drawer/AlertsDrawerHeader";
import AlertsDrawerFilters from "@/app/planner/alerts/components/drawer/AlertsDrawerFilter";
import AlertsDrawerList from "@/app/planner/alerts/components/drawer/AlertsDrawerList";

type AlertsDrawerProps = {
    open: boolean;
    onClose: () => void;
    alerts: PlannerAlert[];
};

export default function AlertsDrawer({
                                         open,
                                         onClose,
                                         alerts,
                                     }: AlertsDrawerProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35">
            <aside className="flex h-full w-full max-w-[430px] flex-col border-l border-slate-200 bg-white shadow-2xl">
                <AlertsDrawerHeader
                    totalAlerts={alerts.length}
                    onClose={onClose}
                />

                <AlertsDrawerFilters
                    allCount={alerts.length}
                    warningCount={
                        alerts.filter(
                            (alert) =>
                                alert.severity === "critical" ||
                                alert.severity === "warning",
                        ).length
                    }
                    infoCount={
                        alerts.filter((alert) => alert.severity === "info").length
                    }
                />

                <AlertsDrawerList alerts={alerts} />
            </aside>
        </div>
    );
}