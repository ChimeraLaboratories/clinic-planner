import DayRulesClient from "./DayRulesClient";
import Link from "next/link";
import { db } from "@/lib/db";

export default async function ClinicianDayRulesPage({
                                                        params,
                                                    }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const clinicianId = Number(id);
    if (!Number.isFinite(clinicianId)) {
        return (
            <div className="p-6">
                <div className="rounded-lg border bg-white p-4">
                    Invalid clinician id.
                </div>
            </div>
        );
    }

    const [rows]: any = await db.query(
        "SELECT full_name FROM clinicians WHERE id = ? LIMIT 1",
        [clinicianId]
    );
    const clinicianName = rows?.[0]?.full_name ?? null;

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-sm text-gray-500">Clinician</div>
                    <h1 className="text-2xl font-bold">
                        Day Rules{clinicianName ? ` - ${clinicianName}` : ""}
                    </h1>
                    <div className="text-sm text-gray-600">
                        Clinician ID: {clinicianId}
                    </div>
                </div>

                <Link
                    href="/planner/clinicians"
                    className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 transition shadow-sm"
                >
                    ← Back to Clinician Management
                </Link>
            </div>

            <DayRulesClient clinicianId={clinicianId} />
        </div>
    );
}