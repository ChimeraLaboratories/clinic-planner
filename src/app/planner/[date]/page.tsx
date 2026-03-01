import { headers } from "next/headers";
import { notFound } from "next/navigation";

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

                {/* Rooms Grid */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">
                        Room Overview
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {data.rooms.map((room) => (
                            <div
                                key={room.id}
                                className={`rounded-lg border bg-white p-5 shadow-sm ${
                                    room.used ? "border-red-300" : "border-green-300"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">{room.name}</h3>
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full ${
                                            room.used
                                                ? "bg-red-100 text-red-600"
                                                : "bg-green-100 text-green-600"
                                        }`}
                                    >
                    {room.used ? "In Use" : "Free"}
                  </span>
                                </div>

                                <div className="mt-3 text-sm text-gray-600 space-y-1">
                                    {room.clinicians.length > 0 ? (
                                        room.clinicians.map((name, index) => (
                                            <div key={index}>• {name}</div>
                                        ))
                                    ) : (
                                        <div className="text-gray-400">No clinician assigned</div>
                                    )}
                                    </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}