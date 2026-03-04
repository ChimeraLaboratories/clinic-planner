"use client";

export type PlannerTab = "month" | "holidays";

export default function ViewTabs({
                                     value,
                                     onChange,
                                 }: {
    value: PlannerTab;
    onChange: (v: PlannerTab) => void;
}) {
    const tabBase =
        "pb-3 text-sm font-medium transition-colors border-b-2 -mb-px";

    const active =
        "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400";

    const inactive =
        "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200";

    return (
        <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800">
            <button
                type="button"
                onClick={() => onChange("month")}
                className={`${tabBase} ${value === "month" ? active : inactive}`}
            >
                Month View
            </button>

            <button
                type="button"
                onClick={() => onChange("holidays")}
                className={`${tabBase} ${value === "holidays" ? active : inactive}`}
            >
                Holiday Booked
            </button>
        </div>
    );
}