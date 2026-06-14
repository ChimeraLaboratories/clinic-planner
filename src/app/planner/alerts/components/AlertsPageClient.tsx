"use client";

import { useMemo, useState } from "react";
import AlertsHeader from "./AlertsHeader";
import AlertSummaryCard from "./AlertSummaryCard";
import AlertFilters from "./AlertFilters";
import AlertList from "./AlertList";
import { mockAlerts } from "../data/mockAlerts";

export default function AlertsPageClient() {
    const [activeFilter, setActiveFilter] = useState("all");

    const activeAlerts = mockAlerts.filter((alert) => alert.status === "active");

    const criticalCount = activeAlerts.filter(
        (alert) => alert.severity === "critical",
    ).length;

    const warningCount = activeAlerts.filter(
        (alert) => alert.severity === "warning" || alert.severity === "critical",
    ).length;

    const infoCount = activeAlerts.filter(
        (alert) => alert.severity === "info",
    ).length;

    const filteredAlerts = useMemo(() => {
        if (activeFilter === "warning") {
            return activeAlerts.filter(
                (alert) =>
                    alert.severity === "warning" || alert.severity === "critical",
            );
        }

        if (activeFilter === "info") {
            return activeAlerts.filter((alert) => alert.severity === "info");
        }

        return activeAlerts;
    }, [activeFilter, activeAlerts]);

    return (
        <main className="min-h-screen bg-slate-50 px-6 py-6">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
                <aside className="flex flex-col gap-6">
                    <AlertsHeader />

                    <AlertSummaryCard
                        total={activeAlerts.length}
                        critical={criticalCount}
                        warning={warningCount}
                        info={infoCount}
                    />
                </aside>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-950">
                                Alerts
                            </h2>
                            <p className="text-sm text-slate-500">
                                Review and resolve planner issues.
                            </p>
                        </div>

                        <div className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                            {activeAlerts.length}
                        </div>
                    </div>

                    <AlertFilters
                        activeFilter={activeFilter}
                        setActiveFilter={setActiveFilter}
                        allCount={activeAlerts.length}
                        warningCount={warningCount}
                        infoCount={infoCount}
                    />

                    <div className="mt-5">
                        <AlertList alerts={filteredAlerts} />
                    </div>
                </section>
            </div>
        </main>
    );
}