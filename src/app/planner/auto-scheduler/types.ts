export type AllocationStatus = "allocated" | "issue" | "no_sessions";

export type SchedulerDay = {
    date: string;
    label: string;
    requested: number;
    allocated: number;
    unallocated: number;
    status: AllocationStatus;
    issues?: string[];
    clinicBreakdown?: {
        st: { allocated: number, requested: number };
        cl: { allocated: number, requested: number };
    };
};

export type SchedulerMonth = {
    title: string;
    days: SchedulerDay[];
};

export type SchedulerSummary = {
    requested: number;
    allocated: number;
    unallocated: number;
    allocationRate: number;
    lastRun: string;
    lastRunBy: string;
};