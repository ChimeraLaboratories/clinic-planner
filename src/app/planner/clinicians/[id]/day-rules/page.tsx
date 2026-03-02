import DayRulesClient from "./DayRulesClient";

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

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-end justify-between gap-3">
                <div>
                    <div className="text-sm text-gray-500">Clinician</div>
                    <h1 className="text-2xl font-bold">Day Rules</h1>
                    <div className="text-sm text-gray-600">Clinician ID: {clinicianId}</div>
                </div>
            </div>

            <DayRulesClient clinicianId={clinicianId} />
        </div>
    );
}