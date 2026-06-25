import { AlertTriangle, ChevronRight } from "lucide-react";
import { SchedulerDay } from "../types";

export function DayDiagnosticPanel({ day }: { day: SchedulerDay }) {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold">03 September 2026</h2>

                    <span className="text-slate-600">(Wednesday)</span>

                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
            <AlertTriangle size={14} />
            1 Unallocated Session
          </span>
                </div>

                <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-slate-50">
                    View full day details
                    <ChevronRight size={17} />
                </button>
            </div>

            <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-[170px_170px_170px_190px_1fr_1.2fr] md:divide-x md:divide-y-0">
                <Metric title="Requested" value={day.requested} suffix="sessions" />
                <Metric title="Allocated" value={day.allocated} suffix="sessions" green />
                <Metric title="Unallocated" value={day.unallocated} suffix="session" red />

                <div className="p-4 text-center">
                    <div className="text-xs font-semibold text-slate-500">
                        Allocation Rate
                    </div>

                    <div className="mt-4 text-2xl font-bold">91.7%</div>

                    <div className="mx-auto mt-3 h-2 w-28 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full w-[91%] rounded-full bg-emerald-500" />
                    </div>
                </div>

                <div className="p-4">
                    <div className="mb-4 text-xs font-semibold text-slate-500">
                        Breakdown by Clinic Type
                    </div>

                    <Breakdown label="ST" value="7 / 8" width="86%" />
                    <Breakdown label="CL" value="4 / 4" width="100%" green />
                </div>

                <div className="p-4">
                    <div className="mb-4 text-xs font-semibold text-slate-500">
                        Issues
                    </div>

                    <div className="flex gap-3">
                        <AlertTriangle
                            size={17}
                            className="mt-0.5 text-amber-500"
                            fill="currentColor"
                        />

                        <div>
                            <p className="text-sm font-bold">
                                1 ST session could not be allocated
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                                Reason: No available clinician with the required skills.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Metric({
                    title,
                    value,
                    suffix,
                    green,
                    red,
                }: {
    title: string;
    value: number;
    suffix: string;
    green?: boolean;
    red?: boolean;
}) {
    return (
        <div className="p-4 text-center">
            <div className="text-xs font-semibold text-slate-500">{title}</div>

            <div
                className={`mt-4 text-2xl font-bold ${
                    green ? "text-emerald-600" : red ? "text-red-600" : ""
                }`}
            >
                {value}
            </div>

            <div
                className={`text-xs ${
                    green ? "text-emerald-600" : red ? "text-red-600" : "text-slate-500"
                }`}
            >
                {suffix}
            </div>
        </div>
    );
}

function Breakdown({
                       label,
                       value,
                       width,
                       green,
                   }: {
    label: string;
    value: string;
    width: string;
    green?: boolean;
}) {
    return (
        <div className="mb-3 flex items-center gap-3 text-sm">
      <span
          className={`h-2 w-2 rounded-full ${
              green ? "bg-emerald-500" : "bg-blue-600"
          }`}
      />

            <span className="w-14 font-semibold">
        {label} {value}
      </span>

            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div
                    className={`h-full rounded-full ${
                        green ? "bg-emerald-500" : "bg-blue-600"
                    }`}
                    style={{ width }}
                />
            </div>
        </div>
    );
}