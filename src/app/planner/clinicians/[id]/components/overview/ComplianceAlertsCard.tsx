import { AlertTriangle, Bell, Info, ScanLine } from "lucide-react";
import ProfileCard from "../ProfileCard";
import StatusBadge from "../StatusBadge";

export default function ComplianceAlertsCard() {
    return (
        <ProfileCard
            title="Compliance & Alerts"
            icon={<Bell className="h-5 w-5" />}
            action={<StatusBadge label="1 serious issue" tone="red" />}
        >
            <div className="space-y-4">
                <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-left"
                >
                    <div className="flex gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                        <div>
                            <p className="font-bold text-red-700">
                                1 FTP decision recorded
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-700">
                                F(25)41 A Chohan Substantive Decision For Publication
                            </p>
                        </div>
                    </div>

                    <span className="text-xl text-red-500">›</span>
                </button>

                <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-left"
                >
                    <div className="flex gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                        <p className="font-bold text-amber-700">
                            Registration expires in 46 days
                        </p>
                    </div>

                    <span className="text-xl text-amber-500">›</span>
                </button>

                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                            <Info className="mt-0.5 h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-sm font-medium text-slate-700">
                                    We automatically scan new GOC documents for updates.
                                </p>
                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Last scan: Today, 14:32
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 shadow-sm"
                        >
                            <ScanLine className="h-4 w-4" />
                            Scan now
                        </button>
                    </div>
                </div>
            </div>
        </ProfileCard>
    );
}