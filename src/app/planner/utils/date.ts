export function toISODate(d: Date) {
    return d.toISOString().split("T")[0];
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
    gridStart.setDate(first.getDate() - firstDow);

    const days: Date[] = [];
    for (let i = 0; i < cells; i++) {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
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