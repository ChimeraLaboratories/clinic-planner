export type RoomSession = {
    id: number;
    clinicianName: string;
    startTime: string | null;
    endTime: string | null;
    requiresSupervisorWarning?: boolean;
};

export type DayRoom = {
    id: number;
    name: string;
    used: boolean;
    sessions: RoomSession[];
};

export type DayApiResponse = {
    rooms: DayRoom[];
    stats: {
        totalSessions: number;
        roomsUsed: number;
        clinicians: number;
    };
};