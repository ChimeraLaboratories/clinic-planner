import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import DayRulesClient from "./DayRulesClient";

export default async function ClinicianDayRulesPage({
                                                        params,
                                                    }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const clinicianId = Number(id);

    if (!Number.isFinite(clinicianId)) return notFound();

    const [rows]: any = await db.query(
        `
    SELECT id, full_name, display_name, role_code, grade_code, is_supervisor, is_active
    FROM clinicians
    WHERE id = ?
    LIMIT 1
    `,
        [clinicianId]
    );

    const clinician = rows?.[0];
    if (!clinician) return notFound();

    return <DayRulesClient clinician={clinician} />;
}