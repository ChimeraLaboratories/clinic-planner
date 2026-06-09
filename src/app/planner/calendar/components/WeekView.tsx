import {PlannerResponse} from "@/app/planner/types/planner";

export default function WeekView({
    anchorMonth,
    data

}: {
    anchorMonth: Date;
    data: PlannerResponse;
}) {
    return (
        <div className="rounded-xl border border-slate-200 p-6 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Week View
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Weekly clinic view will appear here
            </p>
        </div>
    )
}