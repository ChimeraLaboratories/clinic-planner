export function toISODate(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function isSameMonth(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function buildMonthGrid(anchorMonth: Date) {
    const year = anchorMonth.getFullYear();
    const month = anchorMonth.getMonth();

    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    // grid starts on Sunday
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());

    // grid ends on Saturday
    const end = new Date(last);
    end.setDate(last.getDate() + (6 - last.getDay()));

    const days: Date[] = [];
    const cur = new Date(start);

    while (cur <= end) {
        days.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
    }

    return days;
}

// ===== ISO week helpers for alternate weeks =====

function isoWeekStart(d: Date) {
    // Monday as start
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);

    const day = date.getDay(); // 0..6 (Sun..Sat)
    const diff = (day === 0 ? -6 : 1) - day; // move to Monday
    date.setDate(date.getDate() + diff);
    return date;
}

export function getISOWeekNumber(d: Date) {
    // Based on ISO-8601 rules
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);

    // Thursday determines ISO year/week
    const day = date.getDay();
    const thursdayOffset = (day === 0 ? -3 : 4) - day;
    date.setDate(date.getDate() + thursdayOffset);

    const isoYear = date.getFullYear();
    const jan4 = new Date(isoYear, 0, 4);
    const week1Start = isoWeekStart(jan4);

    const diffMs = date.getTime() - week1Start.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    return 1 + Math.floor(diffDays / 7);
}

export function isOddISOWeek(d: Date) {
    return getISOWeekNumber(d) % 2 === 1;
}

export type WeekPattern = "ALL" | "ODD" | "EVEN";

/**
 * Normalizes your `pattern_code` column into ALL/ODD/EVEN.
 *
 * Accepted examples:
 * - 0, null, "", "ALL" => ALL
 * - 1, "1", "A", "ODD", "W1" => ODD
 * - 2, "2", "B", "EVEN", "W2" => EVEN
 */
export function normalizePatternCode(pattern_code: unknown): WeekPattern {
    if (pattern_code === null || pattern_code === undefined) return "ALL";

    const raw = String(pattern_code).trim().toUpperCase();
    if (raw === "" || raw === "0" || raw === "ALL") return "ALL";

    if (
        raw === "1" ||
        raw === "A" ||
        raw === "ODD" ||
        raw === "W1" ||
        raw === "WEEK1"
    )
        return "ODD";

    if (
        raw === "2" ||
        raw === "B" ||
        raw === "EVEN" ||
        raw === "W2" ||
        raw === "WEEK2"
    )
        return "EVEN";

    // Unknown values default to ALL so you don't accidentally hide people
    return "ALL";
}

export function formatPatternLabel(pattern_code: unknown) {
    const p = normalizePatternCode(pattern_code);
    if (p === "ALL") return "All weeks";
    if (p === "ODD") return "Week A (Odd)";
    return "Week B (Even)";
}

export function matchesPattern(pattern_code: unknown, date: Date): boolean {
    const p = normalizePatternCode(pattern_code);
    if (p === "ALL") return true;

    const odd = isOddISOWeek(date);
    return p === "ODD" ? odd : !odd;
}

// ===== existing helper used elsewhere =====

export function getFirstFullWeekend(year: number, month: number) {
    // first Sat+Sun fully inside the month
    for (let day = 1; day <= 31; day++) {
        const d = new Date(year, month, day);
        if (d.getMonth() !== month) break;
        if (d.getDay() === 6) {
            const sun = new Date(year, month, day + 1);
            if (sun.getMonth() === month) {
                return { saturday: day, sunday: day + 1 };
            }
        }
    }
    return null;
}

export function formatMonthTitle(d: Date) {
    return d.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
    });
}