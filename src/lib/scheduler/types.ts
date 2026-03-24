export type Slot = "AM" | "PM" | "FULL";
export type SessionType = "ST" | "CL" | "OTHER";
export type PatternCode = "EVERY" | "W1" | "W2";

export type RoomDemand = {
    room_id: number;
    room_name: string;
    slot: Slot;
    session_type: SessionType;
    priority: number;
};

export type CandidateClinician = {
    id: number;
    full_name: string | null;
    display_name: string | null;
    role_code: number | null;
    grade_code: number | null;
    is_supervisor: number | null;
};

export type PlannedSession = {
    date: string;
    room_id: number;
    room_name: string;
    clinician_id: number;
    clinician_name: string;
    session_type: SessionType;
    slot: Slot;
    notes: string;
};

export type UnfilledDemand = {
    room_id: number;
    room_name: string;
    slot: Slot;
    session_type: SessionType;
    reason: string;
};

export type AutoScheduleDebugRow = {
    rule_id: number;
    clinician_id: number;
    clinician_name: string;
    weekday: number;
    pattern_code: string | null;
    activity_code: string | null;
    room_id: number | null;
    room_allocation_mode: string | null;
    is_available_shift: number | null;
    effective_from: string | null;
    effective_to: string | null;
    derived_session_type: SessionType | null;
    derived_slot: Slot | null;
    included: boolean;
    reason: string;
};

export type AutoScheduleDebugInfo = {
    weekday: number;
    pattern: PatternCode;
    totalRuleRowsFetched: number;
    rowsAfterFiltering: number;
    rows: AutoScheduleDebugRow[];
};

export type AutoScheduleDayResult = {
    date: string;
    pattern: PatternCode;
    allocations: PlannedSession[];
    unfilled: UnfilledDemand[];
    warnings: string[];
    stats: {
        requested: number;
        allocated: number;
        unallocated: number;
    };
    debug?: AutoScheduleDebugInfo;
};

export type AutoScheduleMonthResult = {
    from: string;
    to: string;
    days: AutoScheduleDayResult[];
    summary: {
        totalDays: number;
        totalRequested: number;
        totalAllocated: number;
        totalUnallocated: number;
        totalWarnings: number;
    };
};