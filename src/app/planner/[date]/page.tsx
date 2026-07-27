import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";

import DayRoomsClient from "@/app/planner/[date]/DayRoomsClient";
import type { DayRoom } from "@/app/planner/[date]/types";
import DayExpectedSidebar from "@/app/planner/sidebar/components/DayExpectedSidebar";
import { formatUserDate } from "@/app/planner/utils/userFormat";

type DayApiResponse = {
    rooms: DayRoom[];

    stats: {
        totalSessions: number;
        roomsUsed: number;
        clinicians: number;
    };

    holidays?: any[];
};

type PlannerSession = {
    id?: number;
    room_id?: number | string | null;
    clinician_id?: number | string | null;
    session_type?: string | null;
    type?: string | null;
    clinic_code?: string | null;
    status?: string | null;
};

type PlannerApiResponse = {
    sessions?: PlannerSession[];
    dayRules?: any[];
    data?: {
        sessions?: PlannerSession[];
        dayRules?: any[];
    };
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

type ClinicTotals = {
    totalStClinicians: number;
    totalClClinicians: number;
};

function getBaseUrl(
    host: string,
    forwardedProto: string | null
) {
    if (
        forwardedProto === "http" ||
        forwardedProto === "https"
    ) {
        return `${forwardedProto}://${host}`;
    }

    return process.env.NODE_ENV === "development"
        ? `http://${host}`
        : `https://${host}`;
}

function normalizeClinicians(
    input: ClinicianApi[]
): SidebarClinician[] {
    return (input ?? []).map((clinician) => ({
        id: Number(clinician.id),

        full_name:
            clinician.full_name ?? null,

        display_name:
            String(
                clinician.display_name ?? ""
            ).trim() ||
            String(
                clinician.full_name ?? ""
            ).trim() ||
            `Clinician ${clinician.id}`,

        role_code: Number(
            clinician.role_code ?? 0
        ),

        grade_code: Number(
            clinician.grade_code ?? 0
        ),

        is_supervisor: Number(
            clinician.is_supervisor ?? 0
        ),

        is_active: Number(
            clinician.is_active ?? 1
        ),
    }));
}

/**
 * Counts assigned clinicians based on the session's clinic type.
 *
 * The room name is deliberately not used because an ST clinician
 * may be assigned to a room such as GF.
 *
 * The assignment key combines the clinic type, room and clinician.
 * This prevents AM and PM sessions for the same clinician in the
 * same room from being counted twice.
 */
function countAssignedClinicians(
    sessions: PlannerSession[]
): ClinicTotals {
    const stAssignments = new Set<string>();
    const clAssignments = new Set<string>();

    for (const session of sessions ?? []) {
        const status = String(
            session.status ?? ""
        )
            .trim()
            .toUpperCase();

        if (status === "CANCELLED") {
            continue;
        }

        const clinicianId = Number(
            session.clinician_id
        );

        const roomId = Number(
            session.room_id
        );

        if (
            !Number.isFinite(clinicianId) ||
            clinicianId <= 0
        ) {
            continue;
        }

        const clinicType = String(
            session.session_type ??
            session.type ??
            session.clinic_code ??
            ""
        )
            .trim()
            .toUpperCase();

        /*
         * A room ID should normally exist, but the session ID
         * provides a safe fallback so a valid assignment is not lost.
         */
        const assignmentLocation =
            Number.isFinite(roomId) && roomId > 0
                ? `room-${roomId}`
                : `session-${session.id ?? "unknown"}`;

        const assignmentKey =
            `${clinicType}:${assignmentLocation}:${clinicianId}`;

        if (clinicType.startsWith("ST")) {
            stAssignments.add(assignmentKey);
        }

        if (clinicType.startsWith("CL")) {
            clAssignments.add(assignmentKey);
        }
    }

    return {
        totalStClinicians:
        stAssignments.size,

        totalClClinicians:
        clAssignments.size,
    };
}

export default async function PlannerDayPage({
                                                 params,
                                                 searchParams,
                                             }: {
    params: Promise<{
        date: string;
    }>;

    searchParams?: Promise<{
        m?: string;
    }>;
}) {
    const { date } = await params;

    const resolvedSearchParams =
        (await searchParams) ?? {};

    const monthParam =
        resolvedSearchParams.m;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        notFound();
    }

    const requestHeaders =
        await headers();

    const host =
        requestHeaders.get("host");

    const cookieHeader =
        requestHeaders.get("cookie") ?? "";

    if (!host) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 dark:bg-slate-950">
                <div className="mx-auto max-w-4xl rounded-xl border border-red-200 bg-white p-6 text-red-700 shadow-sm dark:border-red-900/50 dark:bg-slate-900 dark:text-red-300">
                    Unable to determine request host.
                </div>
            </div>
        );
    }

    const baseUrl = getBaseUrl(
        host,
        requestHeaders.get(
            "x-forwarded-proto"
        )
    );

    async function authedFetch(
        url: string
    ) {
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

    let plannerSessions:
        PlannerSession[] = [];

    let dayRules: any[] = [];

    let clinicianList:
        SidebarClinician[] = [];

    let dayLoadError = "";

    /*
     * Load the room cards and day statistics.
     */
    try {
        const dayResponse =
            await authedFetch(
                `${baseUrl}/planner/api/day?date=${encodeURIComponent(date)}`
            );

        if (!dayResponse.ok) {
            throw new Error(
                `Day API failed with status ${dayResponse.status}`
            );
        }

        dayData =
            await dayResponse.json();
    } catch (error) {
        console.error(
            "[PlannerDayPage] failed to load day data:",
            error
        );

        dayLoadError =
            "Unable to load day data right now.";
    }

    /*
     * Load the actual sessions for the selected day.
     *
     * These sessions are used to count ST and CL clinician
     * assignments by session type rather than clinician value.
     *
     * The day rules from this response are also required by
     * DayExpectedSidebar.
     */
    try {
        const plannerResponse =
            await authedFetch(
                `${baseUrl}/planner/api/planner?from=${encodeURIComponent(date)}&to=${encodeURIComponent(date)}`
            );

        if (plannerResponse.ok) {
            const response:
                PlannerApiResponse =
                await plannerResponse.json();

            const root =
                response.data ??
                response;

            plannerSessions =
                Array.isArray(root.sessions)
                    ? root.sessions
                    : [];

            dayRules =
                Array.isArray(root.dayRules)
                    ? root.dayRules
                    : [];
        } else {
            console.error(
                `[PlannerDayPage] planner API failed with status ${plannerResponse.status}`
            );
        }
    } catch (error) {
        console.error(
            "[PlannerDayPage] failed to load sessions and day rules:",
            error
        );
    }

    /*
     * Load clinicians for the room modal and expected-clinicians
     * sidebar.
     */
    try {
        const cliniciansResponse =
            await authedFetch(
                `${baseUrl}/planner/api/clinicians`
            );

        if (cliniciansResponse.ok) {
            const clinicians:
                ClinicianApi[] =
                await cliniciansResponse.json();

            clinicianList =
                normalizeClinicians(
                    clinicians
                );
        } else {
            console.error(
                `[PlannerDayPage] clinicians API failed with status ${cliniciansResponse.status}`
            );
        }
    } catch (error) {
        console.error(
            "[PlannerDayPage] failed to load clinicians:",
            error
        );
    }

    /*
     * These are assignment counts, not ST/CL capacity values.
     */
    const {
        totalStClinicians,
        totalClClinicians,
    } = countAssignedClinicians(
        plannerSessions
    );

    const displayDate =
        new Date(`${date}T00:00:00`);

    const dayName =
        displayDate.toLocaleDateString(
            "en-GB",
            {
                weekday: "long",
            }
        );

    const backHref =
        monthParam
            ? `/planner?m=${monthParam}`
            : "/planner";

    return (
        <div className="min-h-screen bg-gray-50 p-8 dark:bg-slate-950">
            <div className="flex items-start gap-8">
                <div className="sticky top-8 h-fit w-[320px] flex-shrink-0">
                    <DayExpectedSidebar
                        dateISO={`${date}T00:00:00`}
                        clinicians={
                            clinicianList
                        }
                        dayRules={dayRules}
                        rooms={dayData.rooms}
                        holidays={
                            dayData.holidays ??
                            []
                        }
                    />
                </div>

                <div className="max-w-6xl flex-1 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                                {dayName}
                            </h1>

                            <p className="text-gray-500 dark:text-slate-400">
                                {formatUserDate(
                                    displayDate
                                )}
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
                                {
                                    dayData.stats
                                        .roomsUsed
                                }
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                            <div className="grid grid-cols-2">
                                <div className="p-6">
                                    <div className="text-base font-medium tracking-tight text-gray-700 dark:text-slate-200">
                                        Total ST
                                    </div>

                                    <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                                        {
                                            totalStClinicians
                                        }
                                    </div>
                                </div>

                                <div className="border-l border-gray-200 p-6 dark:border-slate-800">
                                    <div className="text-base font-medium tracking-tight text-gray-700 dark:text-slate-200">
                                        Total CL
                                    </div>

                                    <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                                        {
                                            totalClClinicians
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                            <div className="text-base font-medium tracking-tight text-gray-700 dark:text-slate-200">
                                Available Rooms
                            </div>

                            <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                                {Math.max(
                                    0,
                                    dayData.rooms
                                        .length -
                                    dayData.stats
                                        .roomsUsed
                                )}
                            </div>
                        </div>
                    </div>

                    <section>
                        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
                            Room Overview
                        </h2>

                        <DayRoomsClient
                            initialRooms={
                                dayData.rooms
                            }
                            date={date}
                            clinicians={
                                clinicianList
                            }
                        />
                    </section>
                </div>
            </div>
        </div>
    );
}