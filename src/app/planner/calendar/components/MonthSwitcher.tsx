import {ChevronLeft, ChevronRight} from "lucide-react";

export default function MonthSwitcher({
                                          anchorMonth,
                                          onPrevMonth,
                                          onNextMonth,
                                          onCurrentMonth,
                                      }: {
    anchorMonth: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onCurrentMonth: () => void;
}) {
    const today = new Date();

    const isCurrentMonth =
        today.getMonth() === anchorMonth.getMonth() &&
        today.getFullYear() === anchorMonth.getFullYear();

    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={onPrevMonth}
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
                <ChevronLeft className="h-4 w-4"/>
            </button>

            <div className="inline-flex h-12 min-w-[128px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-base font-semibold text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                {anchorMonth.toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                })}
            </div>

            <button
                type="button"
                onClick={onNextMonth}
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
                <ChevronRight className="h-4 w-4"/>
            </button>

            <button
                type="button"
                onClick={onCurrentMonth}
                className={`inline-flex h-12 items-center justify-center rounded-xl border px-6 text-base font-semibold shadow-sm transitions-colors ${
                    isCurrentMonth 
                        ? "border-slate-200 bg-slate-100 text-slate-400 cursor-default"
                        : "border-blue-200 bg-blue-600 text-white hover:bg-blue-700"
                }`}
            >
                Current Month
            </button>
        </div>
    );
}