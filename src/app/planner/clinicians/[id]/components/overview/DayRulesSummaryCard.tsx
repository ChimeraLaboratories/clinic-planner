import { CalendarDays } from "lucide-react";
import ProfileCard from "../ProfileCard";

const days = [
    { day: "Mon", date: "20/06", status: "Day Off", working: false },
    { day: "Tue", date: "21/06", status: "Working", working: true },
    { day: "Wed", date: "22/06", status: "Working", working: true },
    { day: "Thu", date: "23/06", status: "Working", working: true },
    { day: "Fri", date: "24/06", status: "Day Off", working: false },
    { day: "Sat", date: "25/06", status: "Working", working: true },
    { day: "Sun", date: "26/06", status: "Day Off", working: false },
];

export default function DayRulesSummaryCard() {
    return (
        <ProfileCard
            title="Day Rules Summary"
            icon={<CalendarDays className="h-5 w-5" />}
            action={
                <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-blue-600 shadow-sm hover:bg-slate-50"
                >
                    View day rules
                </button>
            }
        >
            <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="grid grid-cols-7 divide-x divide-slate-200">
                    {days.map((day) => (
                        <div key={day.day} className="p-3 text-center">
                            <p className="text-sm font-bold text-slate-950">{day.day}</p>
                            <p className="text-xs font-medium text-slate-500">{day.date}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 divide-x divide-slate-200 border-t border-slate-200">
                    {days.map((day) => (
                        <div key={day.day} className="flex justify-center p-4">
                            <span
                                className={`rounded-lg px-3 py-2 text-sm font-bold ${
                                    day.working
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-red-50 text-red-700"
                                }`}
                            >
                                {day.working ? "✓" : "×"} {day.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <p className="mt-4 text-sm font-medium text-slate-500">
                4 working days • 0 CL days • 0 Ground floor days • 3 days off
            </p>
        </ProfileCard>
    );
}