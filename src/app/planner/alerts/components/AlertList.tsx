import {PlannerAlert} from "@/app/planner/types/alert";
import AlertCard from "@/app/planner/alerts/components/AlertCard";

type AlertListProps = {
    alerts: PlannerAlert[];
};

export default function AlertList({ alerts }: AlertListProps) {
    if (alerts.length === 0) {
        return (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <p className="font-semibold texte-emerald-700">
                    You're all caught up.
                </p>
                <p className="mt-1 text-sm text-emerald-700">
                    No alerts match this filter.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Today
            </p>

            {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
            ))}
        </div>
    );
}