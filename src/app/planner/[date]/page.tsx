import { headers } from "next/headers";
import { notFound } from "next/navigation";

import DayRoomsClient from "@/app/planner/[date]/DayRoomsClient";
import type { DayRoom } from "@/app/planner/[date]/types";

type DayApiResponse = {
    rooms: DayRoom[];
    stats: {
        totalSessions: number;
        roomsUsed: number;
        clinicians: number;
    };
};

type PlannerTotalsLikeResponse = {
    stats?: {
        totalStValue?: number;
        totalClValue?: number;
    };
    totalStValue?: number;
    totalClValue?: number;
    data?: any;
};

function normalizeTotals(raw: any) {
    const root = raw?.data ?? raw ?? {};
    const stats = root?.stats ?? {};
    return {
        totalStValue: Number(stats.totalStValue ?? root.totalStValue ?? 0),
        totalClValue: Number(stats.totalClValue ?? root.totalClValue ?? 0),
    };
}

export default async function PlannerDayPage({
                                                 params,
                                             }: {
    params: Promise<{ date: string }>;
}) {
    const { date } = await params;

    // 1) validate date param early
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return notFound();

    // 2) build absolute URL (server component)
    const h = await headers();
    const host = h.get("host");
    if (!host) return notFound();

    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

    // ✅ A) Day endpoint for Room Overview (rooms + sessions already attached)
    const dayRes = await fetch(`${protocol}://${host}/planner/api/day?date=${date}`, {
        cache: "no-store",
    });
    if (!dayRes.ok) return notFound();
    const dayData: DayApiResponse = await dayRes.json();

    // ✅ B) Month-view endpoint for totals (single-day range)
    // If this endpoint returns a different shape, totals will just be 0.00 instead of crashing.
    let totals = { totalStValue: 0, totalClValue: 0 };
    try {
        const totalsRes = await fetch(
            `${protocol}://${host}/planner/api/planner?from=${date}&to=${date}`,
            { cache: "no-store" }
        );
        if (totalsRes.ok) {
            const rawTotals: PlannerTotalsLikeResponse = await totalsRes.json();
            totals = normalizeTotals(rawTotals);
        }
    } catch {
        totals = { totalStValue: 0, totalClValue: 0 };
    }

    // clinicians list for the modal dropdown
    const cRes = await fetch(`${protocol}://${host}/planner/api/clinicians`, {
        cache: "no-store",
    });
    const clinicianList = cRes.ok ? await cRes.json() : [];

    // Header display
    const displayDate = new Date(`${date}T00:00:00`);
    const dayName = displayDate.toLocaleDateString("en-GB", { weekday: "long" });

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{dayName}</h1>
                        <p className="text-gray-500">{displayDate.toLocaleDateString("en-GB")}</p>
                    </div>
                    <a
                        href="/planner"
                        className="inline-flex items-center px-3 py-2 text-sm rounded border hover:bg-gray-50"
                    >
                        ← Back to Planner
                    </a>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg border p-6 shadow-sm">
                        <div className="text-base font-medium text-gray-700 tracking-tight">Rooms Used</div>
                        <div className="text-3xl font-bold">{dayData.stats.roomsUsed}</div>
                    </div>

                    {/* Split cell: Total ST / Total CL Value (same logic as Month View) */}
                    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                        <div className="grid grid-cols-2">

                            <div className="p-6">
                                <div className="text-base font-medium text-gray-700 tracking-tight">Total ST</div>
                                <div className="text-3xl font-bold text-gray-900">
                                    {Math.round(totals.totalStValue)}
                                </div>
                            </div>

                            <div className="p-6 border-l">
                                <div className="text-base font-medium text-gray-700 tracking-tight">Total CL</div>
                                <div className="text-3xl font-bold text-gray-900">
                                    {Math.round(totals.totalClValue)}
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="bg-white rounded-lg border p-6 shadow-sm">
                        <div className="text-base font-medium text-gray-700 tracking-tight">Available Rooms</div>
                        <div className="text-3xl font-bold">
                            {dayData.rooms.length - dayData.stats.roomsUsed}
                        </div>
                    </div>
                </div>

                <section>
                    <h2 className="text-xl font-semibold mb-4">Room Overview</h2>

                    <DayRoomsClient initialRooms={dayData.rooms} date={date} clinicians={clinicianList} />
                </section>
            </div>
        </div>
    );
}