import {Clinician} from "@/app/planner/clinicians/types";

export default function ClinicianSummaryCards({ clinicians }: { clinicians: Clinician[] }) {
    const total = clinicians.length;
    const active = clinicians.filter((c) => c.is_active).length;
    const preReg = clinicians.filter((c) => c.grade_code === 2).length;
    const supervisors = clinicians.filter((c) => c.is_supervisor).length;
    const inactive = clinicians.filter((c) => !c.is_active).length;

    const cards = [
        { title: "Total Clinicians", value: total, detail: `${active} active`, icon: "👥" },
        { title: "Pre-Reg Clinicians", value: preReg, detail: `${total ? Math.round((preReg / total) * 100) : 0}% of total`, icon: "🎓" },
        { title: "Supervisors", value: supervisors, detail: `${total ? Math.round((supervisors / total) * 100) : 0}% of total`, icon: "🛡️" },
        { title: "Inactive Clinicians", value: inactive, detail: "View inactive", icon: "⏸️" },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
                <div
                    key={card.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                >
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl dark:bg-blue-950/40">
                            {card.icon}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                {card.title}
                            </p>
                            <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                                {card.value}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {card.detail}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}