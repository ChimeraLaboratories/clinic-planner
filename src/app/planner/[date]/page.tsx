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
    holidays?: any[];
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

type ClinicianApi = {
    id: number;
    full_name?: string | null;
    display_name?: string | null;
    role_code?: number | null;
    grade_code?: number | null;
    GOC_number?: string | null;
    is_supervisor?: number | null;
    is_active?: number | null;
};

type SidebarClinician = {
    id: number;
    full_name?: string | null;
    display_name: string;
    role_code: number;
    grade_code: number;
    is_supervisor: number;
    is_active?: number;
};

function normalizeTotals(raw: any) {
    const root = raw?.data ?? raw ?? {};
    const stats = root?.stats ?? {};

    const explicitSt = stats.totalStValue ?? root.totalStValue;
    const explicitCl = stats.totalClValue ?? root.totalClValue;

    if (explicitSt != null || explicitCl != null) {
        return {
            totalStValue: Number(explicitSt ?? 0),
            totalClValue: Number(explicitCl ?? 0),
        };
    }

    const sessions: any[] = Array.isArray(root.sessions) ? root.sessions : [];

    let totalStValue = 0;
    let totalClValue = 0;

    for (const s of sessions) {
        if (String(s?.status ?? "").trim().toUpperCase() === "CANCELLED") continue;

        const t = String(s?.session_type ?? s?.type ?? s?.clinic_code ?? "")
            .trim()
            .toUpperCase();

        const rawVal = s?.value ?? s?.session_value ?? s?.clinic_value ?? 0;
        const v = typeof rawVal === "number" ? rawVal : parseFloat(String(rawVal));

        if (!Number.isFinite(v)) continue;

        if (t.startsWith("ST")) totalStValue += v;
        else if (t.startsWith("CL")) totalClValue += v;
    }

    return { totalStValue, totalClValue };
}

function getBaseUrl(host: string, forwardedProto: string | null) {
    if (forwardedProto === "http" || forwardedProto === "https") {
        return `${forwardedProto}://${host}`;
    }

    return process.env.NODE_ENV === "development" ? `http://${host}` : `https://${host}`;
}

function normalizeClinicians(input: ClinicianApi[]): SidebarClinician[] {
    return (input ?? []).map((c) => ({
        id: Number(c.id),
        full_name: c.full_name ?? null,
        display_name:
            String(c.display_name ?? "").trim() ||
            String(c.full_name ?? "").trim() ||
            `Clinician ${c.id}`,
        role_code: Number(c.role_code ?? 0),
        grade_code: Number(c.grade_code ?? 0),
        is_supervisor: Number(c.is_supervisor ?? 0),
        is_active: Number(c.is_active ?? 1),
    }));
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
    const monthParam = sp?.m;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        notFound();
    }

    const h = await headers();
    const host = h.get("host");
    const cookieHeader = h.get("cookie") ?? "";

    if (!host) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 dark:bg-slate-950">
                <div className="mx-auto max-w-4xl rounded-xl border border-red-200 bg-white p-6 text-red-700 shadow-sm dark:border-red-900/50 dark:bg-slate-900 dark:text-red-300">
                    Unable to determine request host.
                </div>
            </div>
        );
    }

    const baseUrl = getBaseUrl(host, h.get("x-forwarded-proto"));

    async function authedFetch(url: string) {
        return fetch(url, {
            cache: "no-store",
            headers: {
                cookie: cookieHeader,
            },
        });
    }

    let dayData: DayApiResponse = {
        rooms: [],
        stats: {
            totalSessions: 0,
            roomsUsed: 0,
            clinicians: 0,
        },
        holidays: [],
    };

    let totals = { totalStValue: 0, totalClValue: 0 };
    let dayRules: any[] = [];
    let clinicianList: SidebarClinician[] = [];
    let dayLoadError = "";

    try {
        const dayRes = await authedFetch(`${baseUrl}/planner/api/day?date=${date}`);

        if (!dayRes.ok) {
            throw new Error(`Day API failed with status ${dayRes.status}`);
        }

        dayData = await dayRes.json();
    } catch (error) {
        console.error("[PlannerDayPage] failed to load day data:", error);
        dayLoadError = "Unable to load day data right now.";
    }

    try {
        const totalsRes = await authedFetch(
            `${baseUrl}/planner/api/planner?from=${date}&to=${date}`
        );

        if (totalsRes.ok) {
            const rawTotals: PlannerTotalsLikeResponse = await totalsRes.json();
            totals = normalizeTotals(rawTotals);

            const root = (rawTotals as any)?.data ?? rawTotals ?? {};
            dayRules = Array.isArray(root?.dayRules) ? root.dayRules : [];
        } else {
            console.error(
                `[PlannerDayPage] planner totals API failed with status ${totalsRes.status}`
            );
        }
    } catch (error) {
        console.error("[PlannerDayPage] failed to load totals/day rules:", error);
    }

    try {
        const cRes = await authedFetch(`${baseUrl}/planner/api/clinicians`);

        if (cRes.ok) {
            const rawClinicians: ClinicianApi[] = await cRes.json();
            clinicianList = normalizeClinicians(rawClinicians);
        } else {
            console.error(
                `[PlannerDayPage] clinicians API failed with status ${cRes.status}`
            );
        }
    } catch (error) {
        console.error("[PlannerDayPage] failed to load clinicians:", error);
    }

    const displayDate = new Date(`${date}T00:00:00`);
    const dayName = displayDate.toLocaleDateString("en-GB", { weekday: "long" });
    const backHref = monthParam ? `/planner?m=${monthParam}` : "/planner";

    return (
        <div className="min-h-screen bg-gray-50 p-8 dark:bg-slate-950">
            <div className="flex items-start gap-8">
                <div className="sticky top-8 h-fit w-[320px] flex-shrink-0">
                    <DayExpectedSidebar
                        dateISO={`${date}T00:00:00`}
                        clinicians={clinicianList}
                        dayRules={dayRules}
                        rooms={dayData.rooms}
                        holidays={dayData.holidays ?? []}
                    />
                </div>

                <div className="max-w-6xl flex-1 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                                {dayName}
                            </h1>
                            <p className="text-gray-500 dark:text-slate-400">
                                {displayDate.toLocaleDateString("en-GB")}
                            </p>
                        </div>

                        <Link
                            href={backHref}
                            className="inline-flex items-center rounded border border-gray-200 px-3 py-2 text-sm text-gray-900 hover:bg-gray-50 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-900"
                        >
                            ← Back to Planner
                        </Link>
                    </div>

                    {dayLoadError ? (
                        <div className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-700 shadow-sm dark:border-red-900/50 dark:bg-slate-900 dark:text-red-300">
                            {dayLoadError}
                        </div>
                    ) : null}

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                            <div className="text-base font-medium tracking-tight text-gray-700 dark:text-slate-200">
                                Rooms Used
                            </div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                                {dayData.stats.roomsUsed}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                            <div className="grid grid-cols-2">
                                <div className="p-6">
                                    <div className="text-base font-medium tracking-tight text-gray-700 dark:text-slate-200">
                                        Total ST
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                                        {totals.totalStValue.toFixed(2)}
                                    </div>
                                </div>

                                <div className="border-l border-gray-200 p-6 dark:border-slate-800">
                                    <div className="text-base font-medium tracking-tight text-gray-700 dark:text-slate-200">
                                        Total CL
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                                        {totals.totalClValue.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                            <div className="text-base font-medium tracking-tight text-gray-700 dark:text-slate-200">
                                Available Rooms
                            </div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                                {Math.max(0, dayData.rooms.length - dayData.stats.roomsUsed)}
                            </div>
                        </div>
                    </div>

                    <section>
                        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
                            Room Overview
                        </h2>
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