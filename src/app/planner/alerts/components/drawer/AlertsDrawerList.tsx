"use client";

import { useRouter } from "next/navigation";
import type { PlannerAlert } from "@/app/planner/types/alert";
import AlertsDrawerCard from "./AlertsDrawerCard";

type AlertsDrawerListProps = {
    alerts: PlannerAlert[];
};

const MAX_VISIBLE_ALERTS = 4;

function toYmd(date: Date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
}

function getDateGroupLabel(targetDate: string) {
    const todayDate = new Date();
    const yesterdayDate = new Date();

    yesterdayDate.setDate(todayDate.getDate() - 1);

    const today = toYmd(todayDate);
    const yesterday = toYmd(yesterdayDate);

    if (targetDate === today) return "Today";
    if (targetDate === yesterday) return "Yesterday";

    return targetDate;
}

export default function AlertsDrawerList({ alerts }: AlertsDrawerListProps) {
    const router = useRouter();

    const visibleAlerts = alerts.slice(0, MAX_VISIBLE_ALERTS);

    const groupedAlerts = visibleAlerts.reduce<Record<string, PlannerAlert[]>>(
        (groups, alert) => {
            const label = getDateGroupLabel(alert.target_date);

            if (!groups[label]) {
                groups[label] = [];
            }

            groups[label].push(alert);
            return groups;
        },
        {},
    );

    return (
        <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto bg-slate-50/70 px-6 py-5 dark:bg-slate-950">
                <div className="flex flex-col gap-5">
                    {Object.entries(groupedAlerts).map(([label, groupAlerts]) => (
                        <section key={label}>
                            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                {label}
                            </p>

                            <div className="flex flex-col gap-3">
                                {groupAlerts.map((alert) => (
                                    <AlertsDrawerCard
                                        key={alert.id}
                                        alert={alert}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-950">
                <button
                    type="button"
                    onClick={() => router.push("/planner/alerts")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                    View all alerts
                    <span className="text-lg leading-none">→</span>
                </button>
            </div>
        </div>
    );
}