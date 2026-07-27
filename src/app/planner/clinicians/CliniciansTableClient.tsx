"use client";

import { useMemo, useState } from "react";
import type {
    Clinician,
    ClinicianGradeFilter,
    ClinicianRoleFilter,
    ClinicianStatusFilter,
    ClinicianSupervisorFilter,
} from "./types";
import ClinicianSummaryCards from "./components/ClinicianSummaryCards";
import ClinicianFilters from "./components/ClinicianFilters";
import ClinicianTable from "./components/ClinicianTable";
import ClinicianEmptyState from "./components/ClinicianEmptyState";

export default function CliniciansTableClient({ clinicians }: { clinicians: Clinician[] }) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<ClinicianStatusFilter>("active");
    const [role, setRole] = useState<ClinicianRoleFilter>("all");
    const [grade, setGrade] = useState<ClinicianGradeFilter>("all");
    const [supervisor, setSupervisor] = useState<ClinicianSupervisorFilter>("all");

    const filteredClinicians = useMemo(() => {
        return clinicians.filter((clinician) => {
            const matchesSearch =
                clinician.full_name.toLowerCase().includes(search.toLowerCase()) ||
                clinician.display_name.toLowerCase().includes(search.toLowerCase()) ||
                clinician.GOC_number?.toLowerCase().includes(search.toLowerCase());

            const matchesStatus =
                status === "all" ||
                (status === "active" && clinician.is_active) ||
                (status === "inactive" && !clinician.is_active);

            const matchesRole =
                role === "all" ||
                (role === "oo" && clinician.role_code === 1) ||
                (role === "clo" && clinician.role_code === 2);

            const matchesGrade =
                grade === "all" ||
                (grade === "registered" && clinician.grade_code === 1) ||
                (grade === "pre-reg" && clinician.grade_code === 2);

            const matchesSupervisor =
                supervisor === "all" ||
                (supervisor === "yes" && clinician.is_supervisor) ||
                (supervisor === "no" && !clinician.is_supervisor);

            return matchesSearch && matchesStatus && matchesRole && matchesGrade && matchesSupervisor;
        });
    }, [clinicians, search, status, role, grade, supervisor]);

    return (
        <div className="space-y-6">
            <ClinicianSummaryCards clinicians={clinicians} />

            <ClinicianFilters
                search={search}
                status={status}
                role={role}
                grade={grade}
                supervisor={supervisor}
                onSearchChange={setSearch}
                onStatusChange={setStatus}
                onRoleChange={setRole}
                onGradeChange={setGrade}
                onSupervisorChange={setSupervisor}
            />

            {filteredClinicians.length === 0 ? (
                <ClinicianEmptyState />
            ) : (
                <ClinicianTable clinicians={filteredClinicians} />
            )}
        </div>
    );
}