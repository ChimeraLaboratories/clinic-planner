"use client";

import { useMemo } from "react";
import type { PlannerResponse } from "../types/planner";

export default function LowCLValueSidebar({
                                              data,
                                              threshold = 4,
                                          }: {
    data: PlannerResponse;
    threshold?: number;
}) {
    const lowDays = useMemo(() => {
        const map = new Map<string, number>();

        for (const s of data.sessions) {
            const key =
                (s as any).session_date ??
                (s as any).date ??
                (s as any).sessionDate ??
                null;

            if (!key) continue;

            const type = (s as any).session_type;

            if (type === "CL") {
                const current = map.get(key) ?? 0;
                map.set(key, current + 1);
            }
        }

        return [...map.entries()]
            .filter(([, v]) => v < threshold)
            .sort(([a], [b]) => a.localeCompare(b));
    }, [data.sessions, threshold]);

    return (
        <div className="rounded-xl border bg-white shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">
                    Days with Low CL Value
                </h3>

                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
          {lowDays.length}
        </span>
            </div>

            {lowDays.length === 0 && (
                <div className="text-sm text-gray-500">
                    All CL clinics meet expected value
                </div>
            )}

            <div className="space-y-2">
                {lowDays.map(([date, value]) => (
                    <div
                        key={date}
                        className="flex items-center justify-between text-sm border rounded-md px-3 py-2"
                    >
                        <span>{date}</span>

                        <span className="text-red-600 font-medium">
              {value} / {threshold}
            </span>
                    </div>
                ))}
            </div>
        </div>
    );
}