import ClinicianProfileHeader from "./ClinicianProfileHeader";
import ClinicianProfileTabs from "./ClinicianProfileTabs";
import ProfileCard from "./ProfileCard";
import OverviewGrid from "@/app/planner/clinicians/[id]/components/overview/OverviewGrid";

export default function ClinicianProfilePage() {
    return (
        <main className="min-h-screen bg-slate-50 px-8 py-8">
            <div className="mx-auto max-w-[1760px] rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
                <ClinicianProfileHeader
                    fullName="Hamzah Nazir"
                    initials="HN"
                    roleLabel="Registered Optometrist"
                    isActive={true}
                />

                <div className="mt-8">
                    <ClinicianProfileTabs />
                </div>

                <div className="mt-6">
                    <OverviewGrid/>
                </div>
            </div>
        </main>
    );
}