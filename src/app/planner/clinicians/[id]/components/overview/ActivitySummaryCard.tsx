import { BarChart3, Eye, Home, Target, XCircle } from "lucide-react";
import ProfileCard from "../ProfileCard";

const stats = [
    {
        label: "ST Days",
        value: 4,
        icon: Eye,
        colour: "text-blue-600 bg-blue-50",
    },
    {
        label: "CL Days",
        value: 0,
        icon: Target,
        colour: "text-emerald-600 bg-emerald-50",
    },
    {
        label: "Ground Floor Days",
        value: 0,
        icon: Home,
        colour: "text-amber-600 bg-amber-50",
    },
    {
        label: "Days Off",
        value: 3,
        icon: XCircle,
        colour: "text-red-600 bg-red-50",
    },
];

export default function ActivitySummaryCard() {
    return (
        <ProfileCard
            title="Activity Summary"
            icon={<BarChart3 className="h-5 w-5" />}
        >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <div
                            key={stat.label}
                            className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                        >
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.colour}`}>
                                <Icon className="h-5 w-5" />
                            </div>

                            <p className="mt-3 text-xl font-bold text-slate-950">
                                {stat.value}
                            </p>

                            <p className="text-sm font-medium text-slate-500">
                                {stat.label}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4">
                <div>
                    <p className="font-bold text-slate-950">This Week</p>
                    <p className="text-sm font-medium text-slate-500">
                        Week Template A — Alternate week set 1
                    </p>
                </div>

                <button
                    type="button"
                    className="text-sm font-bold text-blue-600 hover:text-blue-700"
                >
                    View week template →
                </button>
            </div>
        </ProfileCard>
    );
}