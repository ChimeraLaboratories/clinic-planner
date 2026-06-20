import {PlannerAlert} from "@/app/planner/types/alert";

type AlertCardProps = {
    alert: PlannerAlert;
};

const severityStyles = {
    critical: {
        icon: "!",
        wrapper: "bg-red-50 text-red-600",
    },
    warning: {
        icon: "!",
        wrapper: "bg-orange-50 text-orange-600",
    },
    info: {
        icon: "i",
        wrapper: "bg-blue-50 text-blue-600",
    },
};

export default function AlertCard({ alert }: AlertCardProps) {
    const style = severityStyles[alert.severity]

    return (
        <button
            type="button"
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
            <div className="flex gap-3">
                <div
                    className={[
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        style.wrapper,
                    ].join(" ")}
                    >
                    {style.icon}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-slate-950">
                            {alert.title}
                        </h3>

                        <span className="shrink-0 text-xs text-slate-400">
                            {alert.time_label ?? alert.target_date}
                        </span>
                    </div>

                    <p className="mt-1 text-sm leading-5 text-slate-600">
                        {alert.description}
                    </p>

                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                        {alert.target_date}
                    </p>
                </div>
            </div>
        </button>
    );
}