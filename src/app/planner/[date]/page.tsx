import { headers } from "next/headers";
import { notFound } from "next/navigation";
import DayRoomsClient from "@/app/planner/[date]/DayRoomsClient";

type PageProps = {
    params: Promise<{ date: string }>;
};

type Room = { id: number; name: string; used: boolean; clinicians: string[]; };

type DayApiResponse = {
    rooms: Room[];
    stats: {
        totalSessions: number;
        roomsUsed: number;
        clinicians: number;
    };
};

export default async function DayOverview({ params }: PageProps) {
    const { date } = await params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return notFound();

    const h = await headers();
    const host = h.get("host");
    if (!host) return notFound();

    const protocol =
        process.env.NODE_ENV === "development" ? "http" : "https";

    const res = await fetch(
        `${protocol}://${host}/planner/api/day?date=${date}`,
        { cache: "no-store" }
    );

    if (!res.ok) return notFound();

    const data: DayApiResponse = await res.json();

    // ✅ DEFINE THESE
    const displayDate = new Date(`${date}T00:00:00`);
    const dayName = displayDate.toLocaleDateString("en-GB", {
        weekday: "long",
    });

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {dayName}
                        </h1>
                        <p className="text-gray-500">
                            {displayDate.toLocaleDateString("en-GB")}
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg border p-6 shadow-sm">
                        <div className="text-sm text-gray-500">Rooms Used</div>
                        <div className="text-3xl font-bold">
                            {data.stats.roomsUsed}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border p-6 shadow-sm">
                        <div className="text-sm text-gray-500">
                            Clinicians Working
                        </div>
                        <div className="text-3xl font-bold">
                            {data.stats.clinicians}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border p-6 shadow-sm">
                        <div className="text-sm text-gray-500">
                            Available Rooms
                        </div>
                        <div className="text-3xl font-bold">
                            {data.rooms.length - data.stats.roomsUsed}
                        </div>
                    </div>
                </div>

                {/* Rooms Section */}
                <section>
                    <h2 className="text-xl font-semibold mb-4">
                        Room Overview
                    </h2>

                    <DayRoomsClient initialRooms={data.rooms} />
                </section>

            </div>
        </div>
    );
}