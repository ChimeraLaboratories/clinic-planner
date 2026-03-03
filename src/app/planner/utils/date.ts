export function toISODate(d: Date): string {
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

// Sunday-start grid: variable weeks x 7 days
export function buildMonthGrid(anchor: Date) {
    const first = startOfMonth(anchor);
    const last = endOfMonth(anchor);

    const firstDow = first.getDay(); // 0 = Sun
    const totalDaysInMonth = last.getDate();

    const usedCells = firstDow + totalDaysInMonth;
    const weeks = Math.ceil(usedCells / 7);
    const cells = weeks * 7;

    const gridStart = new Date(first);
    gridStart.setHours(12,0,0,0);
    gridStart.setDate(first.getDate() - firstDow);

    const days: Date[] = [];
    for (let i = 0; i < cells; i++) {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        d.setHours(12,0,0,0);
        days.push(d);
    }
    return days;
}

export function isSameMonth(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function formatMonthTitle(d: Date) {
    return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

export function getFirstFullWeekend(year: number, month: number) {
    // month = 0-based (JS Date standard)

    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);

        // 6 = Saturday
        if (date.getDay() === 6) {
            const sunday = new Date(year, month, day + 1);

            if (sunday.getMonth() === month) {
                return {
                    saturday: day,
                    sunday: day + 1,
                };
            }
        }
    }

    return null;
}