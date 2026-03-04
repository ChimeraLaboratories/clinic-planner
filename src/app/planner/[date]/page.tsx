import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";

import DayRoomsClient from "@/app/planner/[date]/DayRoomsClient";
import type { DayRoom } from "@/app/planner/[date]/types";
import DayExpectedSidebar from "@/app/planner/components/DayExpectedSidebar";

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

    // 1) Prefer explicit totals from API if present
    const explicitSt = stats.totalStValue ?? root.totalStValue;
    const explicitCl = stats.totalClValue ?? root.totalClValue;

    if (explicitSt != null || explicitCl != null) {
        return {
            totalStValue: Number(explicitSt ?? 0),
            totalClValue: Number(explicitCl ?? 0),
        };
    }

    // 2) Fallback: compute totals from sessions array (match MonthGrid/DayCell logic)
    const sessions: any[] = Array.isArray(root.sessions) ? root.sessions : [];

    let totalStValue = 0;
    let totalClValue = 0;

    for (const s of sessions) {
        // match month grid: ignore cancelled
        if (String(s?.status ?? "").trim().toUpperCase() === "CANCELLED") continue;

        const t = String(s.session_type ?? s.type ?? s.clinic_code ?? "")
            .trim()
            .toUpperCase();

        // ✅ SINGLE SOURCE OF TRUTH: use API-computed `value`
        // (this is derived from clinician_capacity join in /api/planner)
        const rawVal = s.value ?? s.session_value ?? s.clinic_value ?? 0;

        const v = typeof rawVal === "number" ? rawVal : parseFloat(String(rawVal));
        if (!Number.isFinite(v)) continue;

        if (t.startsWith("ST")) totalStValue += v;
        else if (t.startsWith("CL")) totalClValue += v;
    }

    return { totalStValue, totalClValue };
}

export default async function PlannerDayPage({
                                                 params,
                                                 searchParams,
                                             }: {
    params: Promise<{ date: string }>;
    searchParams?: Promise<{ m?: string }>;
}) {
    const { date } = await params;
    const sp = (await searchParams) ?? {};
    const monthParam = sp?.m; // expected "YYYY-MM"

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

    // ✅ B) Month-view endpoint for totals (single-day range) + dayRules
    let totals = { totalStValue: 0, totalClValue: 0 };
    let dayRules: any[] = [];

    try {
        const totalsRes = await fetch(
            `${protocol}://${host}/planner/api/planner?from=${date}&to=${date}`,
            { cache: "no-store" }
        );

        if (totalsRes.ok) {
            const rawTotals: PlannerTotalsLikeResponse = await totalsRes.json();
            totals = normalizeTotals(rawTotals);

            const root = (rawTotals as any)?.data ?? rawTotals ?? {};
            dayRules = Array.isArray(root?.dayRules) ? root.dayRules : [];
        }
    } catch {
        totals = { totalStValue: 0, totalClValue: 0 };
        dayRules = [];
    }

    // clinicians list for the modal dropdown
    const cRes = await fetch(`${protocol}://${host}/planner/api/clinicians`, {
        cache: "no-store",
    });
    const clinicianList = cRes.ok ? await cRes.json() : [];

    // Header display
    const displayDate = new Date(`${date}T00:00:00`);
    const dayName = displayDate.toLocaleDateString("en-GB", { weekday: "long" });

    const backHref = monthParam ? `/planner?m=${monthParam}` : "/planner";

    // IMPORTANT: set this to your rota’s Week A anchor date (same one used everywhere else)
    const trainingStart = new Date("2026-01-05T00:00:00");

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* ✅ Month-view style shell: sidebar flush left, main content to the right */}
            <div className="flex gap-8 items-start">
                {/* Left sidebar (flush to page padding edge) */}
                <div className="w-[320px] flex-shrink-0 sticky top-8 h-fit">
                    <DayExpectedSidebar
                        date={displayDate}
                        clinicians={clinicianList}
                        dayRules={dayRules}
                        trainingStart={trainingStart}
                        rooms={dayData.rooms}
                    />
                </div>

                {/* Main content (keep your existing centered width) */}
                <div className="flex-1 max-w-6xl space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{dayName}</h1>
                            <p className="text-gray-500">
                                {displayDate.toLocaleDateString("en-GB")}
                            </p>
                        </div>

                        <Link
                            href={backHref}
                            className="inline-flex items-center px-3 py-2 text-sm rounded border hover:bg-gray-50"
                        >
                            ← Back to Planner
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg border p-6 shadow-sm">
                            <div className="text-base font-medium text-gray-700 tracking-tight">
                                Rooms Used
                            </div>
                            <div className="text-3xl font-bold">{dayData.stats.roomsUsed}</div>
                        </div>

                        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                            <div className="grid grid-cols-2">
                                <div className="p-6">
                                    <div className="text-base font-medium text-gray-700 tracking-tight">
                                        Total ST
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900">
                                        {totals.totalStValue.toFixed(2)}
                                    </div>
                                </div>

                                <div className="p-6 border-l">
                                    <div className="text-base font-medium text-gray-700 tracking-tight">
                                        Total CL
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900">
                                        {totals.totalClValue.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border p-6 shadow-sm">
                            <div className="text-base font-medium text-gray-700 tracking-tight">
                                Available Rooms
                            </div>
                            <div className="text-3xl font-bold">
                                {dayData.rooms.length - dayData.stats.roomsUsed}
                            </div>
                        </div>
                    </div>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">Room Overview</h2>

                        <DayRoomsClient
                            initialRooms={dayData.rooms}
                            date={date}
                            clinicians={clinicianList}
                        />
                    </section>
                </div>
            </div>
        </div>
    );
}