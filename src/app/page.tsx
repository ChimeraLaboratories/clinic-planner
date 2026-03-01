"use client";
// This tells Next.js this file runs in the browser.
// We need this because we're using React state (useState)

import { useMemo } from "react";
import { MonthCalendar } from "@/components/clinic-planner/MonthCalendar"
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
                  <div className="bg-white rounded-2xl shadow p-4 h-44 hover:shadow-lg transition cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">{day}</span>
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                  3 free
                </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm">
                      <div className="text-gray-700">Room 1 – Zara</div>
                      <div className="text-gray-700">Room 2 – Cane</div>
                      <div className="text-gray-400">Room 3 – Free</div>
                    </div>

                    <div className="mt-4 text-sm font-medium text-blue-600">
                      Value: 42
                    </div>
                  </div>
              )}
          />
        </div>
      </main>
  );
}