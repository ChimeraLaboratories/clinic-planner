import { CalendarDays } from "lucide-react";
import { SchedulerMonth } from "../types";
import { StatusDot } from "./StatusDot";

export function MonthAllocationCalendar({ month }: { month: SchedulerMonth }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white">
                        <CalendarDays size={18} />
                    </div>

                    <h2 className="text-xl font-bold">{month.title}</h2>
                </div>

                <div className="flex items-center gap-5 text-xs font-medium text-slate-500">
                    <Legend colour="bg-emerald-500" label="Fully Allocated" />
                    <Legend colour="bg-amber-500" label="Issues" />
                    <Legend colour="bg-slate-300" label="No Sessions" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-7">
                {month.days.map((day) => (
                    <button
                        key={day.date}
                        className="rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
                    >
                        <div className="mb-3 text-center text-sm font-semibold text-slate-700">
                            {day.label}
                        </div>

                        <div className="flex items-center justify-center gap-2">
                            <StatusDot status={day.status} />

                            <span className="text-sm font-bold">
                {day.allocated} / {day.requested}
              </span>
                        </div>

                        <p
                            className={`mt-1 text-center text-xs font-medium ${
                                day.status === "allocated"
                                    ? "text-emerald-600"
                                    : "text-slate-500"
                            }`}
                        >
                            {day.status === "allocated"
                                ? "Allocated"
                                : day.status === "issue"
                                    ? `${day.unallocated} Unallocated`
                                    : "No sessions"}
                        </p>
                    </button>
                ))}
            </div>
        </section>
    );
}

function Legend({ colour, label }: { colour: string; label: string }) {
    return (
        <span className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${colour}`} />
            {label}
    </span>
    );
}