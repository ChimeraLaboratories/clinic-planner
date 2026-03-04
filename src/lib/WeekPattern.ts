export type WeekPattern = "W1" | "W2";

/**
 * Set this to the REAL start date of Week A/W1 in your rota.
 * Based on your expectation for 18/04/2026 being W1, this is very likely:
 * 2026-03-30 (Monday)
 */
export const ROTATION_ANCHOR_YMD = "2026-01-05";

function parseYmdLocal(ymd: string) {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function getWeekPatternFromYmd(dateYmd: string, anchorYmd = ROTATION_ANCHOR_YMD): WeekPattern {
    const date = parseYmdLocal(dateYmd);
    const anchor = parseYmdLocal(anchorYmd);
    const diffDays = Math.floor((date.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(diffDays / 7);
    return weekIndex % 2 === 0 ? "W1" : "W2";
}

export function patternToLabel(p: WeekPattern) {
    return p === "W1" ? "Week A" : "Week B";
}