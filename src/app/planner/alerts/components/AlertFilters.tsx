type AlertFiltersProp = {
    activeFilter: string;
    setActiveFilter: (filter: string) => void;
    allCount: number;
    warningCount: number;
    infoCount: number;
};

export default function AlertFilters({
    activeFilter,
    setActiveFilter,
    allCount,
    warningCount,
    infoCount,
    }: AlertFiltersProp) {
    const filters = [
        { label: "All", value: "all", count: allCount },
        { label: "Warning", value: "warning", count: warningCount },
        { label: "Info", value: "info", count: infoCount },
    ];

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex gap-2">
                {filters.map((filter) => {
                    const isActive = activeFilter === filter.value;

                    return (
                        <button
                            key={filter.value}
                            type="button"
                            onClick={() => setActiveFilter(filter.value)}
                            className={[
                                "rounded-full px-4 py-2 text-sm font-medium transition",
                                isActive
                                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                                    : "text-slate-600 hover:bg-slate-100,"
                            ].join(" ")}
                            >
                            {filter.label} {filter.count}
                        </button>
                    );
                })}
            </div>

            <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
                >
                Newest first
            </button>
        </div>
    );
}