import type { PreviewRow } from "./types";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function badge(row: PreviewRow) {
    if (row.status === "non-working") return "Day Off";
    if (row.activity_code === "CL") return "CL";
    return "ST";
}

export function LiveAllocationPreview({
                                          preview,
                                          loading,
                                          lastUpdated,
                                          onRefresh,
                                      }: {
    preview: PreviewRow[];
    loading: boolean;
    lastUpdated: string | null;
    onRefresh: () => void;
}) {
    return (
        <aside className="sticky top-8 h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="px-7 py-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Live Allocation Preview</h2>
                    <span className="text-slate-500">ⓘ</span>
                </div>

                <p className="mt-4 text-sm font-medium leading-7 text-slate-500">
                    Based on current rules, room assignment is shown below.
                </p>
            </div>

            <div>
                {loading ? (
                    <div className="px-7 py-6 text-sm font-semibold text-slate-500">
                        Loading preview...
                    </div>
                ) : (
                    preview.map((row) => {
                        const off = row.status === "non-working";

                        return (
                            <div
                                key={row.weekday}
                                className={`border-t border-slate-200 px-5 py-4 ${
                                    off ? "border-l-2 border-l-red-500" : "border-l-2 border-l-emerald-500"
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="font-bold">{dayNames[row.weekday]}</div>
                                    <div className="text-sm font-semibold text-slate-500">20/06</div>
                                    <span
                                        className={`rounded-md px-3 py-1 text-xs font-bold ${
                                            off ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                                        }`}
                                    >
                    {badge(row)}
                  </span>
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                    <div className="text-sm font-bold">
                                        {off ? (
                                            <span className="font-semibold text-slate-500">Not working</span>
                                        ) : (
                                            <>
                                                <span className="mr-2 text-emerald-600">●</span>
                                                {row.label}
                                            </>
                                        )}
                                    </div>

                                    {!off && (
                                        <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      Allocated
                    </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-7 py-5 text-sm font-semibold text-slate-500">
                <span>Last updated: Today {lastUpdated ?? "--:--"}</span>
                <button onClick={onRefresh} className="text-lg text-blue-600">
                    ↻
                </button>
            </div>
        </aside>
    );
}