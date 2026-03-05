export type Room = {
    id: number;
    name: string;
};

export type Clinician = {
    id: number;
    display_name?: string | null;
    full_name?: string | null;
    role_code?: number | null; // 1=OO, 2=CLO (based on your comments)
    grade_code?: number | null;
    is_supervisor?: number | null;
    is_active?: number | null;
};

export type Session = {
    id: number;
    session_date: string | Date;
    room_id: number;
    clinician_id: number | null;
    session_type: string; // "ST", "CL", etc
    slot: "AM" | "PM" | "FULL";
    status: "DRAFT" | "PUBLISHED" | "CANCELLED";
    notes?: string | null;

    // backend may add this computed
    value?: number;
};

export type DayRule = {
    clinician_id: number;
    weekday: number; // 0=Sun..6=Sat
    pattern_code: string | number | null; // your alt-week column
    activity_code?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    effective_from?: string | null;
    effective_to?: string | null;
    note?: string | null;
    is_active?: number | null;
    is_available_shift?: number | null; // 1 = available
};

export type SupervisionByDateRow = {
    date: string;
    preRegCount: number;
    supervisorCount: number;
    needsSupervisor: boolean;
    preRegs: string;
    supervisors: string;
    supervisorsInClinic: string;
    supervisorsInStore: string;
};

export type PlannerResponse = {
    rooms: Room[];
    clinicians: Clinician[];
    sessions: Session[];
    supervisionByDate: SupervisionByDateRow[];
    holidays: any[];
    stats: {
        totalStValue: number;
        totalClValue: number;
    };
    dayRules: DayRule[];
};