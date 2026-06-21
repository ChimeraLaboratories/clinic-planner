export type Clinician = {
    id: number;
    full_name: string;
    display_name: string;
    role_code: number;
    grade_code: number;
    GOC_number: string | null;
    is_supervisor: number;
    is_active: number;
};

export type ClinicianStatusFilter = "all" | "active" | "inactive";
export type ClinicianSupervisorFilter = "all" | "yes" | "no";
export type ClinicianGradeFilter = "all" | "registered" | "pre-reg";
export type ClinicianRoleFilter = "all" | "oo" | "clo";