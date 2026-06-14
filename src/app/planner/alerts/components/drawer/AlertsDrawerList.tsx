
import AlertsDrawerCard from "./AlertsDrawerCard";
import {PlannerAlert} from "@/app/planner/types/alert";
import {useRouter} from "next/navigation";

type AlertsDrawerListProps = {
    alerts: PlannerAlert[];
};

const MAX_VISIBLE_ALERTS = 5;

export default function AlertsDrawerList({ alerts }: AlertsDrawerListProps) {
    const router = useRouter();

    const visibleAlerts = alerts.slice(0, MAX_VISIBLE_ALERTS);
    const hiddenAlertCount = Math.max(alerts.length - MAX_VISIBLE_ALERTS, 0);

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="mb-3 flex items-center justify-between">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Latest alerts
                    </p>

                    {hiddenAlertCount > 0 && (
                        <p className="text-xs font-medium text-slate-400">
                            +{hiddenAlertCount} more
                        </p>
                    )}
                </div>


                <div className="flex flex-col gap-3">
                    {visibleAlerts.map((alert) => (
                        <AlertsDrawerCard key={alert.id} alert={alert} />
                    ))}
                </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-6 py-4">
                <button
                    type="button"
                    onClick={() => router.push("/planner/alerts")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-800"
                >
                    View all alerts
                    <span className="text-lg leading-none">→</span>
                </button>
            </div>
        </div>
    );
}