export function toISODate(d: Date) {
    return d.toISOString().split("T")[0];
}

export function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

// Sunday-start grid: 6 weeks x 7 days
export function buildMonthGrid(anchor: Date) {
    const first = startOfMonth(anchor);
    const firstDow = first.getDay(); // 0 = Sun
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - firstDow);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
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