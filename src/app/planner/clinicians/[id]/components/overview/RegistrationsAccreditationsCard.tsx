import {
    Award,
    BadgeCheck,
    Building2,
    Eye,
    Hospital,
    ShieldCheck,
    Stethoscope,
} from "lucide-react";
import ProfileCard from "../ProfileCard";
import StatusBadge from "../StatusBadge";

const items = [
    {
        title: "NHS Performer List",
        status: "Registered",
        expiry: "30 Nov 2025",
        icon: Hospital,
    },
    {
        title: "MECS",
        status: "Accredited",
        expiry: "31 Aug 2026",
        icon: Eye,
    },
    {
        title: "Glaucoma",
        status: "Accredited",
        expiry: "31 Aug 2026",
        icon: ShieldCheck,
    },
    {
        title: "Medical Retina",
        status: "Accredited",
        expiry: "31 Aug 2026",
        icon: Stethoscope,
    },
    {
        title: "Independent Prescriber",
        status: "Accredited",
        expiry: "31 Dec 2026",
        icon: BadgeCheck,
    },
    {
        title: "SpaMedica",
        status: "Approved",
        expiry: "30 Nov 2025",
        icon: Building2,
    },
];

export default function RegistrationsAccreditationsCard() {
    return (
        <ProfileCard
            title="Additional Registrations & Accreditations"
            icon={<Award className="h-5 w-5" />}
            action={
                <button
                    type="button"
                    className="text-sm font-bold text-blue-600 hover:text-blue-700"
                >
                    View all credentials →
                </button>
            }
        >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                {items.map((item) => {
                    const Icon = item.icon;

                    return (
                        <div
                            key={item.title}
                            className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4"
                        >
                            <Icon className="h-5 w-5 text-slate-600" />

                            <p className="mt-3 text-sm font-bold text-slate-950">
                                {item.title}
                            </p>

                            <div className="mt-2">
                                <StatusBadge label={item.status} tone="green" />
                            </div>

                            <p className="mt-2 text-xs font-medium text-slate-500">
                                Expiry: {item.expiry}
                            </p>
                        </div>
                    );
                })}
            </div>
        </ProfileCard>
    );
}