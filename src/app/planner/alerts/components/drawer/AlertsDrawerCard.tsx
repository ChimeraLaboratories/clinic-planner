"use client";

import { useRouter } from "next/navigation";
import type { PlannerAlert } from "@/app/planner/types/alert";

type AlertsDrawerCardProps = {
    alert: PlannerAlert;
};

const severityStyles = {
    critical: {
        icon: "!",
        iconClass: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300",
    },
    warning: {
        icon: "!",
        iconClass: "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300",
    },
    info: {
        icon: "i",
        iconClass: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300",
    },
};

export default function AlertsDrawerCard({ alert }: AlertsDrawerCardProps) {
    const router = useRouter();
    const style = severityStyles[alert.severity];

    return (
        <button
            type="button"
            onClick={() => router.push(`/planner/alerts/${alert.id}`)}
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900"
        >
            <div className="flex gap-4">
                <div
                    className={[
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        style.iconClass,
                    ].join(" ")}
                >
                    {style.icon}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                            {alert.title}
                        </h3>

                        <span className="shrink-0 text-sm text-slate-500 dark:text-slate-400">
                            {alert.time_label ?? "Yesterday"}
                        </span>
                    </div>

                    <p className="mt-2 max-w-[280px] text-sm leading-6 text-slate-700 dark:text-slate-300">
                        {alert.description}
                    </p>
                </div>
            </div>
        </button>
    );
}