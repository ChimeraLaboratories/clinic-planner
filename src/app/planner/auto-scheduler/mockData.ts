import { SchedulerMonth, SchedulerSummary } from "./types";

export const mockSchedulerSummary: SchedulerSummary = {
    requested: 248,
    allocated: 240,
    unallocated: 8,
    allocationRate: 96.8,
    lastRun: "Today at 09:32",
    lastRunBy: "Case Birmingham",
};

export const mockSchedulerMonth: SchedulerMonth = {
    title: "September 2026",
    days: [
        ["01 Mon", 10, 10],
        ["02 Tue", 12, 12],
        ["03 Wed", 12, 11],
        ["04 Thu", 10, 10],
        ["05 Fri", 12, 12],
        ["06 Sat", 8, 8],
        ["07 Sun", 0, 0],
        ["08 Mon", 10, 10],
        ["09 Tue", 11, 11],
        ["10 Wed", 12, 12],
        ["11 Thu", 11, 10],
        ["12 Fri", 12, 12],
        ["13 Sat", 8, 8],
        ["14 Sun", 0, 0],
        ["15 Mon", 10, 10],
        ["16 Tue", 12, 12],
        ["17 Wed", 11, 11],
        ["18 Thu", 10, 10],
        ["19 Fri", 12, 12],
        ["20 Sat", 8, 8],
        ["21 Sun", 0, 0],
        ["22 Mon", 10, 10],
        ["23 Tue", 11, 11],
        ["24 Wed", 10, 9],
        ["25 Thu", 10, 10],
        ["26 Fri", 12, 12],
        ["27 Sat", 8, 8],
        ["28 Sun", 0, 0],
        ["29 Mon", 10, 10],
        ["30 Tue", 11, 11],
    ].map(([label, requested, allocated], index) => {
        const unallocated = Number(requested) - Number(allocated);

        return {
            date: `2026-09-${String(index + 1).padStart(2, "0")}`,
            label: String(label),
            requested: Number(requested),
            allocated: Number(allocated),
            unallocated,
            status:
                Number(requested) === 0
                    ? "no_sessions"
                    : unallocated > 0
                        ? "issue"
                        : "allocated",
            issues: unallocated > 0 ? [`${unallocated} session could not be allocated`] : [],
            clinicBreakdown: {
                st: { allocated: 7, requested: 8 },
                cl: { allocated: 4, requested: 4 },
            },
        };
    }),
};