import { RefreshCw, ShieldCheck } from "lucide-react";
import ProfileCard from "../ProfileCard";
import StatusBadge from "../StatusBadge";

export default function GocRegistrationCard() {
    return (
        <ProfileCard
            title="GOC Registration"
            icon={<ShieldCheck className="h-5 w-5" />}
            action={<StatusBadge label="Up to date" tone="green" />}
        >
            <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-5">
                    <div>
                        <p className="text-sm font-semibold text-slate-500">GOC Number</p>
                        <p className="mt-1 text-xl font-bold text-blue-600">01-44561</p>
                        <div className="mt-2">
                            <StatusBadge label="Verified" tone="green" />
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-500">Registration Status</p>
                        <p className="mt-1 font-bold text-slate-950">Registered</p>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-500">Registered As</p>
                        <p className="mt-1 font-bold text-slate-950">Optometrist</p>
                    </div>
                </div>

                <div className="space-y-5 border-slate-100 md:border-l md:pl-6">
                    <div>
                        <p className="text-sm font-semibold text-slate-500">
                            Date of most recent registration
                        </p>
                        <p className="mt-1 font-bold text-slate-950">27 Nov 2024</p>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-500">Registration Expiry</p>
                        <p className="mt-1 font-bold text-slate-950">
                            30 Nov 2025{" "}
                            <span className="text-amber-600">(in 46 days)</span>
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-500">Practice Locations</p>
                        <p className="mt-1 font-bold text-slate-950">Bolton</p>
                    </div>
                </div>

                <div className="space-y-5 border-slate-100 md:border-l md:pl-6">
                    <div>
                        <p className="text-sm font-semibold text-slate-500">
                            Qualifications from GOC
                        </p>
                        <p className="mt-1 font-bold text-slate-950">BSc MCOptom</p>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-500">
                            Specialties from GOC
                        </p>
                        <p className="mt-1 font-bold text-slate-950">None</p>
                    </div>

                    <button
                        type="button"
                        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-50"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh from GOC
                    </button>
                </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 text-sm font-medium text-slate-500">
                Last verified: Today, 14:32
            </div>
        </ProfileCard>
    );
}