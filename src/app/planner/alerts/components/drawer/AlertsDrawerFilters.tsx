type AlertsDrawerFiltersProps = {
    allCount: number;
    warningCount: number;
    infoCount: number;
};

export default function AlertsDrawerFilters({
                                                allCount,
                                                warningCount,
                                                infoCount,
                                            }: AlertsDrawerFiltersProps) {
    return (
        <div className="border-b border-slate-200 px-6 pb-5 dark:border-slate-800">
            <div className="flex items-center gap-8">
                <button
                    type="button"
                    className="rounded-full bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/60"
                >
                    All <span className="ml-1">{allCount}</span>
                </button>

                <button
                    type="button"
                    className="rounded-full px-1 py-2 text-sm font-medium text-slate-700 transition hover:text-blue-700 dark:text-slate-300"
                >
                    Warnings <span className="ml-1">{warningCount}</span>
                </button>

                <button
                    type="button"
                    className="rounded-full px-1 py-2 text-sm font-medium text-slate-700 transition hover:text-blue-700 dark:text-slate-300"
                >
                    Info <span className="ml-1">{infoCount}</span>
                </button>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                        Sort
                    </span>

                    <button
                        type="button"
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    >
                        Newest first <span className="ml-2 text-slate-400">⌄</span>
                    </button>
                </div>

                <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                    ⌁ <span className="ml-2">Filter</span>
                </button>
            </div>
        </div>
    );
}