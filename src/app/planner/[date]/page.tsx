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

type ClinicianOption = { id: number; display_name: string };

export default async function PlannerDayPage({params,}: {
    params: Promise<{ date: string }>;
}) {
    const {date} = await params;


    // 1) validate date param early
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return notFound();

    // 2) build absolute URL (server component)
    const h = await headers();
    const host = h.get("host");
    if (!host) return notFound();

    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

    // 3) fetch the day data (rooms + sessions + stats)
    const res = await fetch(`${protocol}://${host}/planner/api/day?date=${date}`, {
        cache: "no-store",
    });

    if (!res.ok) return notFound();

    const data: DayApiResponse = await res.json();

    const cRes = await fetch(`${protocol}://${host}/planner/api/clinicians`, {
        cache: "no-store",
    });

    const clinicianList = cRes.ok ? await cRes.json() : [];

    // ✅ this is what DayRoomsClient wants
    const initialRooms = data.rooms;

    // 4) fetch clinicians list for the modal dropdown
    // If you don't have this endpoint yet, it will just fall back to []
    let clinicians: ClinicianOption[] = [];
    try {
        const cRes = await fetch(`${protocol}://${host}/planner/api/clinicians`, {
            cache: "no-store",
        });

        if (cRes.ok) {
            const cJson = await cRes.json();
            // expect: [{ id, display_name }, ...]
            clinicians = Array.isArray(cJson) ? cJson : cJson?.clinicians ?? [];
        }
    } catch {
        clinicians = [];
    }

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
                        <p className="text-gray-500">
                            {displayDate.toLocaleDateString("en-GB")}
                        </p>
                    </div>
                    <a href="/planner" className="inline-flex items-center px-3 py-2 text-sm rounded border hover:bg-gray-50">
                        ← Back to Planner
                    </a>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg border p-6 shadow-sm">
                        <div className="text-sm text-gray-500">Rooms Used</div>
                        <div className="text-3xl font-bold">{data.stats.roomsUsed}</div>
                    </div>

                    <div className="bg-white rounded-lg border p-6 shadow-sm">
                        <div className="text-sm text-gray-500">Clinicians Working</div>
                        <div className="text-3xl font-bold">{data.stats.clinicians}</div>
                    </div>

                    <div className="bg-white rounded-lg border p-6 shadow-sm">
                        <div className="text-sm text-gray-500">Available Rooms</div>
                        <div className="text-3xl font-bold">
                            {data.rooms.length - data.stats.roomsUsed}
                        </div>
                    </div>
                </div>

                <section>
                    <h2 className="text-xl font-semibold mb-4">Room Overview</h2>

                    <DayRoomsClient
                        initialRooms={data.rooms}
                        date={date}
                        clinicians={clinicianList}
                    />
                </section>
            </div>
        </div>
    );
}