import { CalendarDays, Pencil, Users } from "lucide-react";
import StatusBadge from "./StatusBadge";

type ClinicianProfileHeaderProps = {
    fullName: string;
    initials: string;
    roleLabel: string;
    isActive: boolean;
};

export default function ClinicianProfileHeader({
                                                   fullName,
                                                   initials,
                                                   roleLabel,
                                                   isActive,
                                               }: ClinicianProfileHeaderProps) {
    return (
        <header>
            <a
                href="/planner/clinicians"
                className="mb-8 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
                ← Back to Clinicians
            </a>

            <div className="flex items-start justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                        {initials}
                    </div>

                    <div>
                        <h1 className="text-3xl font-bold tracking-[-0.03em] text-slate-950">
                            {fullName}
                        </h1>

                        <div className="mt-3 flex flex-wrap items-center gap-3">
                            <StatusBadge label={roleLabel} tone="purple" />

                            <StatusBadge
                                label={isActive ? "Active" : "Inactive"}
                                tone={isActive ? "green" : "red"}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-50"
                    >
                        <Pencil className="h-4 w-4" />
                        Edit profile
                    </button>

                    <button
                        type="button"
                        className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
                    >
                        <CalendarDays className="h-4 w-4" />
                        Manage day rules
                    </button>
                </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-5 text-sm font-medium text-slate-600">
                <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Started 12 Sep 2022
                </span>

                <span className="h-4 w-px bg-slate-200" />

                <span>Full-time</span>

                <span className="h-4 w-px bg-slate-200" />

                <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Supervisor
                </span>
            </div>
        </header>
    );
}