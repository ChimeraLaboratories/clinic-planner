"use client";
// This tells Next.js this file runs in the browser.
// We need this because we're using React state (useState)

import { useMemo } from "react";
import { MonthCalendar } from "@/components/clinic-planner/MonthCalendar"
import { DayCard } from "@/components/clinic-planner/DayCard"

// useState lets us store and manage dynamic values inside the component.

// Pad numbers to 2 digits (1 > 01)
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// Convert date -> YYYY-MM-DD
function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function sundayStartIndex(jsDay: number) {
    return jsDay;
}


export default function Home() {
  const year = 2026;
  const month = 0; // January

  // Calculate month layout
  const { leadingEmptyCells, days } = useMemo(() => {
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = sundayStartIndex(first.getDay());

    const daysArr = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateKey = toDateKey(new Date(year, month, day));
      return { day, dateKey };
    });

    return { leadingEmptyCells: leading, days: daysArr };
  }, [year, month]);

  return (
      <main className="min-h-screen bg-slate-100 p-10">
        <div className="max-w-7xl mx-auto">
          <MonthCalendar
              title="Clinic Planner – January 2026"
              weekdayLabels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
              leadingEmptyCells={leadingEmptyCells}
              days={days}
              renderDay={({ day }) => (
                  <DayCard
                      day={day}
                      roomsFreeText="3 free"
                      previewLines={[
                          "Room 1 – Zara",
                          "Room 2 – Cane",
                          "Room 3 – Free",
                      ]}
                      valueText="Value: 42"
                      onClick={() => console.log("Clicked day:", day)}
                  />
              )}
          />
        </div>
      </main>
  );
}