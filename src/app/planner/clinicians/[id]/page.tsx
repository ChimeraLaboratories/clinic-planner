import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ClinicianFormClient from "@/app/planner/clinicians/CliniciansFormClient";

type Clinician = {
    id: number;
    full_name: string;
    display_name: string;
    role_code: number;
    grade_code: number;
    GOC_number: string | null;
    is_supervisor: number;
    is_active: number;
};

export default async function EditClinicianPage({
                                                    params,
                                                }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const clinicianId = Number(id);
    if (!Number.isFinite(clinicianId)) return notFound();

    const h = await headers();
    const host = h.get("host");
    if (!host) return notFound();
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

    const res = await fetch(`${protocol}://${host}/planner/api/clinicians/${clinicianId}`, {
        cache: "no-store",
    });

    if (!res.ok) return notFound();

    const clinician: Clinician = await res.json();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    Clinician Management
                </h1>

                <ClinicianFormClient
                    mode="edit"
                    clinicianId={clinicianId}
                    initial={clinician}
                />
            </div>
        </div>
    );
}