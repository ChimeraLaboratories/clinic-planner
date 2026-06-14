
import AlertsDrawerCard from "./AlertsDrawerCard";
import {PlannerAlert} from "@/app/planner/types/alert";

type AlertsDrawerListProps = {
    alerts: PlannerAlert[];
};

export default function AlertsDrawerList({ alerts }: AlertsDrawerListProps) {
    return (
        <div className="flex-1 overflow-y-auto px-6 py-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                Today
            </p>

            <div className="flex flex-col gap-3">
                {alerts.map((alert) => (
                    <AlertsDrawerCard key={alert.id} alert={alert} />
                ))}
            </div>
        </div>
    );
}