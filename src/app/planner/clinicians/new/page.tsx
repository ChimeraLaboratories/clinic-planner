import ClinicianFormClient from "@/app/planner/clinicians/CliniciansFormClient";

export default function NewClinicianPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    Clinician Management
                </h1>

                <ClinicianFormClient
                    mode="new"
                    initial={{
                        full_name: "",
                        display_name: "",
                        role_code: 1,
                        grade_code: 1,
                        GOC_number: null,
                        is_supervisor: 0,
                        is_active: 1,
                    }}
                />
            </div>
        </div>
    );
}