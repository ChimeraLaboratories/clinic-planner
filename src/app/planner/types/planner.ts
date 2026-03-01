export type Room = { id: number | string; name: string };

export type Clinician = {
    id: number | string;
    name: string;
    role?: string;
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
};

export type PlannerResponse = {
    rooms: Room[];
    clinicians: Clinician[];
    sessions: Session[];
};