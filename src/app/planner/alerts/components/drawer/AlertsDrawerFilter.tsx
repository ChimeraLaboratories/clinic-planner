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
        <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-100"
                >
                    All {allCount}
                </button>

                <button
                    type="button"
                    className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                    Warnings {warningCount}
                </button>

                <button
                    type="button"
                    className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                    Info {infoCount}
                </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Sort</span>

                    <button
                        type="button"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
                    >
                        Newest first
                    </button>
                </div>

                <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
                >
                    Filter
                </button>
            </div>
        </div>
    );
}