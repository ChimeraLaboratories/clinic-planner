export type Room = { id: number | string; name: string };

export type Clinician = {
    id: number | string;
    name: string;
    role?: string;
};

export type Session = {
    id: number | string;
    date: string; // YYYY-MM-DD
    clinicianId?: number | string;
    clinicianName?: string;
    roomId?: number | string;
    roomName?: string;
    type?: "ST" | "CL";
    time?: string; // Full Day / AM / PM etc
    notes?: string;
};

export type PlannerResponse = {
    rooms: Room[];
    clinicians: Clinician[];
    sessions: Session[];
};