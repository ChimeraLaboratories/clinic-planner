import { Clock } from "lucide-react";
import ProfileCard from "../ProfileCard";
import StatusBadge from "../StatusBadge";

export default function LatestActivityCard() {
    return (
        <ProfileCard
            title="Latest Activity"
            icon={<Clock className="h-5 w-5" />}
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                    <div>
                        <p className="font-bold text-slate-950">
                            GOC profile last verified
                        </p>
                        <p className="text-sm font-medium text-slate-500">
                            Checked automatically by the system
                        </p>
                    </div>

                    <StatusBadge label="No changes" tone="green" />
                </div>

                <p className="text-sm font-medium text-slate-500">
                    Today, 14:32
                </p>
            </div>
        </ProfileCard>
    );
}