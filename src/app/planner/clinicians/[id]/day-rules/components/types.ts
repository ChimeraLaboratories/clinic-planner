export type Pattern = "W1" | "W2";

export type Clinician = {
    id: number;
    full_name: string;
    display_name: string;
    role_code: number;
    grade_code: number;
    is_supervisor: number;
    is_active: number;
};

export type DayRuleRow = {
    id: number | null;
    weekday: number;
    activity_code: string;
    start_time: string | null;
    end_time: string | null;
    note: string | null;
    effective_from: string | null;
    effective_to: string | null;
    pattern_code: string;
};

export type PreviewRow = {
    weekday: number;
    activity_code: string | null;
    status:
        | "allocated"
        | "ground-floor"
        | "support-floor"
        | "store-general"
        | "admin"
        | "non-working"
        | "unallocated"
        | "unset";
    roomId: number | null;
    roomName: string | null;
    label: string;
};