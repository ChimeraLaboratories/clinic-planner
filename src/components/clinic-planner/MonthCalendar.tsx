"use client"

import React from "react";

// Represents a single day in the calendar
export type MonthCalendarDay = {
    day: number;
    dateKey: string;
};

// Props for reusable month grid
type Props = {
    title: string;
    weekdayLabels: string[];
    leadingEmptyCells: number;
    days: MonthCalendarDay[];
    renderDay: (d: MonthCalendarDay) => React.ReactNode;
};

export function MonthCalendar({
    title,
    weekdayLabels,
    leadingEmptyCells,
    days,
    renderDay,
    }: Props) {
    return (
        <section className="w-full">
            {/* Month title */}
            <h1 className="text-4x1 font-bold mb-8">{title}</h1>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-6 mb-4 text-sm font-medium text-gray-600">
                {weekdayLabels.map((d) => (
                    <div key={d}>{d}</div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-6">
                {/* Empty cells before day 1 */}
                {Array.from({ length: leadingEmptyCells }).map((_, i) => (
                    <div key={`empty-${i}`}/>
                ))}

                {/* Actual days */}
                {days.map((d) => (
                    <React.Fragment key={d.dateKey}>
                        {renderDay(d)}
                    </React.Fragment>
                ))}
            </div>
        </section>
    );
}