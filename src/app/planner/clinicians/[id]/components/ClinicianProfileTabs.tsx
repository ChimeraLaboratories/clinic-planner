import {
    Award,
    CalendarDays,
    ClipboardList,
    FileText,
    History,
    ShieldCheck,
    User,
} from "lucide-react";

const tabs = [
    {
        label: "Overview",
        icon: Award,
        active: true,
    },
    {
        label: "Personal",
        icon: User,
        active: false,
    },
    {
        label: "Professional GOC",
        icon: ShieldCheck,
        active: false,
    },
    {
        label: "Qualifications & Accreditations",
        icon: ClipboardList,
        active: false,
    },
    {
        label: "Planner",
        icon: CalendarDays,
        active: false,
    },
    {
        label: "Documents",
        icon: FileText,
        active: false,
    },
    {
        label: "History",
        icon: History,
        active: false,
    },
];

export default function ClinicianProfileTabs() {
    return (
        <nav className="border-b border-slate-200">
            <div className="flex gap-2 overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.label}
                            type="button"
                            className={`flex h-14 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition ${
                                tab.active
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-slate-500 hover:text-slate-900"
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}