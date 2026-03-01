"use client";
// This tells Next.js this file runs in the browser.
// We need this because we're using React state (useState)

import { useState } from "react";
// useState lets us store and manage dynamic values inside the component.

export default function Home() {
  // new Date(2026, 0) means Year = 2026, Month = 0 (JS is 0 based so 0 = January)
  const [selectedMonth] = useState(new Date(2026, 0));

  // Extract year and month from selected date
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();

  // getDay returns what day the 1st of the month falls on
  const jsDay = new Date(year, month, 1).getDay();

  const firstDay = new Date(year, month, 1).getDay()

  // Get how many days are in month
  const daysInMonth = new Date(year, month +1, 0).getDate();

  // Creates an array holding all days
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
      <main className="min-h-screen bg-slate-100 p-10">
        {/* Page container with background and padding */}

        <div className="max-w-7xl mx-auto">
          {/* Limits width and centers content */}

          <h1 className="text-4xl font-bold mb-8">
            Clinic Planner - January 2026
          </h1>

          {/* Calendar grid:
              grid-cols-7 = 7 columns (Mon-Sun style layout)
              gap-6 = spacing between cells
           */}
          <div className="grid grid-cols-7 gap-6 mb-4 text-sm font-medium text-gray-600">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day}>{day}</div>
            ))}

            {/* Loop through each day in the month */}
            {daysArray.map((day) => (
                <div key={day} className="bg-white rounded -2xl shadow p-4 h-44 hover:shadow-lg transition cursor-pointer">
                  {/* Top section of day card */}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">
                      {day}
                    </span>

                    {/* Fake "rooms free" badge for now */}
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                      3 free
                    </span>
                  </div>

                  {/* Room preview list (currently hardcoded) */}
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="text-grey-700">Room 1 - Zara</div>
                    <div className="text-grey-700">Room 2 - Cane</div>
                    <div className="text-grey-700">Room 3 - Free</div>
                  </div>

                  {/* Fake clinical value total */}
                  <div className="mt-4 text-sm font-medium text-blue-600">
                    Value: 42
                  </div>
                </div>
            ))}
          </div>
        </div>
      </main>
  );
}