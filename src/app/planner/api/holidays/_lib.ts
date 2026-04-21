import { db } from "@/lib/db";

type RemoveClinicianFromSessionsArgs = {
    clinicianId: number;
    fromDate: string; // YYYY-MM-DD
    toDate?: string;  // YYYY-MM-DD
};

function isIsoDate(value: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function removeClinicianFromFutureSessionsForHoliday({
                                                                      clinicianId,
                                                                      fromDate,
                                                                      toDate,
                                                                  }: RemoveClinicianFromSessionsArgs) {
    if (!Number.isInteger(clinicianId) || clinicianId <= 0) {
        throw new Error("Invalid clinicianId");
    }

    if (!isIsoDate(fromDate)) {
        throw new Error("Invalid fromDate");
    }

    const endDate = toDate ?? fromDate;

    if (!isIsoDate(endDate)) {
        throw new Error("Invalid toDate");
    }

    const [result]: any = await db.query(
        `
        UPDATE sessions s
        SET
            s.clinician_id = NULL,
            s.notes = CASE
                WHEN s.notes IS NULL OR TRIM(s.notes) = '' THEN 'Clinician removed due to holiday'
                WHEN s.notes LIKE '%Clinician removed due to holiday%' THEN s.notes
                ELSE CONCAT(s.notes, ' | Clinician removed due to holiday')
            END
        WHERE s.clinician_id = ?
          AND s.session_date BETWEEN GREATEST(?, CURDATE()) AND GREATEST(?, CURDATE())
          AND s.status IN ('DRAFT', 'PUBLISHED')
        `,
        [clinicianId, fromDate, endDate]
    );

    return {
        affectedRows: Number(result?.affectedRows ?? 0),
    };
}