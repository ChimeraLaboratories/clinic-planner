export type Room = { id: number | string; name: string };

export type Clinician = {
    id: number | string;
    full_name: string;
    role?: string;
    display_name?: string;
};

export type Session = {
    id: number | string;
    date: string; // YYYY-MM-DD
    clinician_id?: number | string;
    clinicianName?: string;
    room_id?: number | string;
    roomName?: string;
    type?: "ST" | "CL";
    time?: string; // Full Day / AM / PM etc
    notes?: string;
    status?: string;
    session_type?: "ST" | "CL" | string;
    value?: number | string;
};

export type SupervisionByDateRow = {
    date: string;
    preRegCount: number;
    supervisorCount: number;
    supervisorInClinicCount: number;
    supervisorInStoreCount: number;
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
    supervisionByDate: SupervisionByDateRow[]; // ✅ add this
    // stats?: { totalStValue: number; totalClValue: number }; // optional if you add it later
};