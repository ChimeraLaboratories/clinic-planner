import {mockSchedulerMonth, mockSchedulerSummary} from "@/app/planner/auto-scheduler/mockData";
import {SchedulerControlPanel} from "@/app/planner/auto-scheduler/components/SchedulerControlPanel";
import {MonthAllocationCalendar} from "@/app/planner/auto-scheduler/components/MonthAllocationCalendar";
import {SchedulingSummaryPanel} from "@/app/planner/auto-scheduler/components/SchedulingSummaryPanel";
import {DayDiagnosticPanel} from "@/app/planner/auto-scheduler/components/DayDiagnosticPanel";

export default function AutoSchedulerPage() {
    const selectedDay = mockSchedulerMonth.days.find(
        (day) => day.date === "2026-09-03",
    );

    return (
        <main className="min-h-screen bg-slate-50 px-8 py-7 text-slate-950">
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Auto Scheduler</h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Generate or preview automatic clinic plans based on your day rules,
                        room availability and allocation preferences.
                    </p>
                </div>

                <button className="text-sm font-medium text-slate-500 hover:text-blue-700">
                    ⓘ How it works
                </button>
            </div>

            <SchedulerControlPanel />

            <div className="mt-6 grid-cols-1 gap-6 xl:grid-cols-[1fr_520px]">
                <MonthAllocationCalendar month={mockSchedulerMonth} />
                <SchedulingSummaryPanel summary={mockSchedulerSummary} />
            </div>

            {selectedDay && (
                <div className="mt-6">
                    <DayDiagnosticPanel day={selectedDay} />
                </div>
            )}
        </main>
    );
}