import { History, Sparkles } from "lucide-react";
import { SchedulerSummary } from "../types";
import { SummaryMetricCard } from "./SummaryMetricCard";

export function SchedulingSummaryPanel({
                                           summary,
                                       }: {
    summary: SchedulerSummary;
}) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue-600">
                    <Sparkles size={20} />
                </div>

                <h2 className="text-lg font-bold">Scheduling Summary</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <SummaryMetricCard
                    label="Requested"
                    value={summary.requested}
                    suffix="sessions"
                    tone="green"
                />

                <SummaryMetricCard
                    label="Allocated"
                    value={summary.allocated}
                    suffix="sessions"
                    tone="green"
                />

                <SummaryMetricCard
                    label="Unallocated"
                    value={summary.unallocated}
                    suffix="sessions"
                    tone="red"
                />

                <SummaryMetricCard
                    label="Allocation Rate"
                    value={`${summary.allocationRate}%`}
                    tone="blue"
                />
            </div>

            <hr className="my-6 border-slate-200" />

            <h3 className="mb-4 font-bold">What happens next?</h3>

            <ol className="space-y-4 text-sm text-slate-600">
                {[
                    "Preview shows the estimated allocation for the selected period.",
                    "Review any days with unallocated sessions to understand why.",
                    "Click Apply to generate or update the auto-generated sessions.",
                ].map((item, index) => (
                    <li key={item} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {index + 1}
            </span>
                        {item}
                    </li>
                ))}
            </ol>

            <hr className="my-6 border-slate-200" />

            <div>
                <h3 className="mb-3 font-bold">Last run</h3>

                <div className="flex items-center justify-between gap-4">
                    <p className="flex items-center gap-3 text-sm text-slate-700">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-xs text-white">
              ✓
            </span>
                        {summary.lastRun} by {summary.lastRunBy}
                    </p>

                    <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm hover:bg-slate-50">
                        <History size={17} />
                        View history
                    </button>
                </div>
            </div>
        </section>
    );
}