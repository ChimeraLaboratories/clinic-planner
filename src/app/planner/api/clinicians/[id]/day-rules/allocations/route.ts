import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";

type Pattern = "W1" | "W2";

type RoomRow = RowDataPacket & {
    id: number;
    name: string;
};

type ClinicianRow = RowDataPacket & {
    id: number;
    full_name: string | null;
    display_name: string | null;
    role_code: number | null;
    grade_code: number | null;
    is_supervisor: number | null;
};

type DayRuleRow = RowDataPacket & {
    id: number | null;
    clinician_id: number;
    weekday: number | null;
    pattern_code: string | null;
    activity_code: string | null;
    effective_from: string | null;
    effective_to: string | null;
};

type PriorityRuleRow = RowDataPacket & {
    clinician_id: number;
    room_id: number;
    priority: number | null;
    is_prereg_override: number | null;
};

type PreviewStatus =
    | "allocated"
    | "ground-floor"
    | "support-floor"
    | "store-general"
    | "admin"
    | "non-working"
    | "unallocated"
    | "unset";

type PreviewRow = {
    weekday: number;
    activity_code: string | null;
    status: PreviewStatus;
    roomId: number | null;
    roomName: string | null;
    label: string;
};

type ExpectedOccupant = {
    roomId: number;
    clinicianId: number;
    clinicianName: string;
    source: "fixed-priority" | "fallback" | "prereg-override";
    priority: number | null;
};

function isValidISODate(s: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function normalizePattern(input: any): Pattern {
    const s = String(input ?? "").trim().toUpperCase();
    if (s === "1" || s === "A" || s === "ODD" || s === "W1" || s === "WEEK1") {
        return "W1";
    }
    if (s === "2" || s === "B" || s === "EVEN" || s === "W2" || s === "WEEK2") {
        return "W2";
    }
    return "W1";
}

function matchesPattern(rulePattern: string | null, targetPattern: Pattern): boolean {
    const value = String(rulePattern ?? "").trim().toUpperCase();
    const target = String(targetPattern).trim().toUpperCase();

    if (!value || value === "ALL" || value === "ANY") {
        return true;
    }

    return value === target;
}

function normalizeActivity(activityCode: string | null): string {
    return String(activityCode ?? "").trim().toUpperCase();
}

function isNonWorkingActivity(activityCode: string | null): boolean {
    const value = normalizeActivity(activityCode);

    if (!value) return true;

    const nonWorkingCodes = new Set([
        "OFF",
        "DO",
        "D/O",
        "DAY OFF",
        "DAY_OFF",
        "HOL",
        "HOLIDAY",
        "AL",
        "ANNUAL LEAVE",
        "ANNUAL_LEAVE",
        "SICK",
        "SL",
    ]);

    return nonWorkingCodes.has(value);
}

function isGroundFloorActivity(activityCode: string | null): boolean {
    const value = normalizeActivity(activityCode);
    return value === "GF_DAY" || value === "GF" || value === "GROUND_FLOOR";
}

function isSupportFloorActivity(activityCode: string | null): boolean {
    return normalizeActivity(activityCode) === "SF";
}

function isStoreGeneralActivity(activityCode: string | null): boolean {
    return normalizeActivity(activityCode) === "SG";
}

function isAdminActivity(activityCode: string | null): boolean {
    return normalizeActivity(activityCode) === "ADMIN";
}

function countsForStandardRoomAllocation(activityCode: string | null): boolean {
    const value = normalizeActivity(activityCode);

    if (!value) return false;
    if (isNonWorkingActivity(value)) return false;
    if (isGroundFloorActivity(value)) return false;
    if (isSupportFloorActivity(value)) return false;
    if (isStoreGeneralActivity(value)) return false;
    if (isAdminActivity(value)) return false;

    return true;
}

function getMatchingRuleForWeekdayPattern(
    clinicianId: number,
    weekday: number,
    pattern: Pattern,
    asOfDate: string,
    dayRules: DayRuleRow[]
): DayRuleRow | null {
    const matches = dayRules.filter((rule) => {
        if (Number(rule.clinician_id) !== clinicianId) return false;
        if (Number(rule.weekday) !== weekday) return false;
        if (!matchesPattern(rule.pattern_code, pattern)) return false;

        const from = String(rule.effective_from ?? "").slice(0, 10);
        const to = rule.effective_to ? String(rule.effective_to).slice(0, 10) : null;

        if (!from || from > asOfDate) return false;
        if (to && to < asOfDate) return false;

        return true;
    });

    if (matches.length === 0) {
        return null;
    }

    matches.sort((a, b) => {
        const aTime = a.effective_from ? new Date(a.effective_from).getTime() : 0;
        const bTime = b.effective_from ? new Date(b.effective_from).getTime() : 0;
        return bTime - aTime;
    });

    return matches[0];
}

function buildPreviewLabel(status: PreviewStatus, roomName: string | null): string {
    switch (status) {
        case "allocated":
            return roomName ?? "Allocated";
        case "ground-floor":
            return "Ground Floor";
        case "support-floor":
            return "Shop Floor";
        case "store-general":
            return "SG Testing";
        case "admin":
            return "Admin";
        case "non-working":
            return "No room";
        case "unallocated":
            return "Unallocated";
        case "unset":
        default:
            return "—";
    }
}

function displayNameForClinician(clinician: ClinicianRow): string {
    return String(clinician.display_name || clinician.full_name || "Unknown");
}

function allocateRoomsSimple(params: {
    rooms: Array<{ id: number; name: string }>;
    clinicians: ClinicianRow[];
    priorityRules: PriorityRuleRow[];
}): {
    expectedOccupants: ExpectedOccupant[];
    unallocated: Array<{ clinicianId: number; clinicianName: string }>;
} {
    const { rooms, clinicians, priorityRules } = params;

    const remainingRooms = new Map<number, { id: number; name: string }>();
    rooms.forEach((room) => remainingRooms.set(room.id, room));

    const remainingClinicians = new Map<number, ClinicianRow>();
    clinicians.forEach((clinician) => remainingClinicians.set(Number(clinician.id), clinician));

    const expectedOccupants: ExpectedOccupant[] = [];

    const sortedRules = [...priorityRules].sort((a, b) => {
        const aPriority = a.priority == null ? Number.MAX_SAFE_INTEGER : Number(a.priority);
        const bPriority = b.priority == null ? Number.MAX_SAFE_INTEGER : Number(b.priority);
        if (aPriority !== bPriority) return aPriority - bPriority;
        return Number(a.clinician_id) - Number(b.clinician_id);
    });

    for (const rule of sortedRules) {
        const clinicianId = Number(rule.clinician_id);
        const roomId = Number(rule.room_id);

        if (!remainingClinicians.has(clinicianId)) continue;
        if (!remainingRooms.has(roomId)) continue;

        const clinician = remainingClinicians.get(clinicianId)!;
        const room = remainingRooms.get(roomId)!;

        expectedOccupants.push({
            roomId,
            clinicianId,
            clinicianName: displayNameForClinician(clinician),
            source: Number(rule.is_prereg_override ?? 0) ? "prereg-override" : "fixed-priority",
            priority: rule.priority == null ? null : Number(rule.priority),
        });

        remainingClinicians.delete(clinicianId);
        remainingRooms.delete(roomId);
    }

    const fallbackClinicians = Array.from(remainingClinicians.values()).sort((a, b) =>
        displayNameForClinician(a).localeCompare(displayNameForClinician(b))
    );
    const fallbackRooms = Array.from(remainingRooms.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    const fallbackCount = Math.min(fallbackClinicians.length, fallbackRooms.length);

    for (let i = 0; i < fallbackCount; i += 1) {
        const clinician = fallbackClinicians[i];
        const room = fallbackRooms[i];

        expectedOccupants.push({
            roomId: room.id,
            clinicianId: Number(clinician.id),
            clinicianName: displayNameForClinician(clinician),
            source: "fallback",
            priority: null,
        });
    }

    const allocatedClinicianIds = new Set(expectedOccupants.map((x) => x.clinicianId));

    const unallocated = fallbackClinicians
        .filter((c) => !allocatedClinicianIds.has(Number(c.id)))
        .map((c) => ({
            clinicianId: Number(c.id),
            clinicianName: displayNameForClinician(c),
        }));

    return { expectedOccupants, unallocated };
}

export async function GET(
    req: Request,
    ctx: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await ctx.params;
        const clinicianId = Number(id);

        if (!Number.isFinite(clinicianId)) {
            return NextResponse.json({ error: "Invalid clinician id" }, { status: 400 });
        }

        const url = new URL(req.url);
        const dateParam = url.searchParams.get("date");
        const patternParam = url.searchParams.get("pattern");

        const asOfDate =
            dateParam && isValidISODate(dateParam)
                ? dateParam
                : new Date().toISOString().slice(0, 10);

        const pattern = normalizePattern(patternParam);

        const [rooms] = await db.query<RoomRow[]>(
            `
                SELECT id, name
                FROM rooms
                ORDER BY name
            `
        );

        const [clinicians] = await db.query<ClinicianRow[]>(
            `
                SELECT
                    id,
                    full_name,
                    display_name,
                    role_code,
                    grade_code,
                    is_supervisor
                FROM clinicians
                WHERE is_active = 1
            `
        );

        const [dayRules] = await db.query<DayRuleRow[]>(
            `
                SELECT
                    id,
                    clinician_id,
                    weekday,
                    pattern_code,
                    activity_code,
                    effective_from,
                    effective_to
                FROM clinician_day_rule
                WHERE is_active = 1
                  AND effective_from <= ?
                  AND (effective_to IS NULL OR effective_to >= ?)
            `,
            [asOfDate, asOfDate]
        );

        const [priorityRules] = await db.query<PriorityRuleRow[]>(
            `
                SELECT
                    clinician_id,
                    room_id,
                    priority,
                    is_prereg_override
                FROM clinician_room_priority
                WHERE is_active = 1
                ORDER BY priority ASC, clinician_id ASC, room_id ASC
            `
        );

        const groundFloorRoom =
            rooms.find(
                (room) => String(room.name).trim().toUpperCase() === "GROUND FLOOR"
            ) ?? null;

        const standardRooms = rooms
            .filter(
                (room) => String(room.name).trim().toUpperCase() !== "GROUND FLOOR"
            )
            .map((room) => ({
                id: Number(room.id),
                name: String(room.name),
            }));

        const previews: PreviewRow[] = [];

        for (let weekday = 0; weekday <= 6; weekday += 1) {
            const requestedRule = getMatchingRuleForWeekdayPattern(
                clinicianId,
                weekday,
                pattern,
                asOfDate,
                dayRules
            );

            const standardAllocClinicians = clinicians.filter((clinician) => {
                const matchedRule = getMatchingRuleForWeekdayPattern(
                    Number(clinician.id),
                    weekday,
                    pattern,
                    asOfDate,
                    dayRules
                );

                if (!matchedRule) return false;

                return countsForStandardRoomAllocation(matchedRule.activity_code);
            });

            const groundFloorClinician =
                clinicians.find((clinician) => {
                    const matchedRule = getMatchingRuleForWeekdayPattern(
                        Number(clinician.id),
                        weekday,
                        pattern,
                        asOfDate,
                        dayRules
                    );

                    if (!matchedRule) return false;

                    return isGroundFloorActivity(matchedRule.activity_code);
                }) ?? null;

            const allocation = allocateRoomsSimple({
                rooms: standardRooms,
                clinicians: standardAllocClinicians,
                priorityRules,
            });

            const expectedByClinicianId = new Map<
                number,
                { roomId: number | null; roomName: string | null; status: PreviewStatus }
            >();

            for (const item of allocation.expectedOccupants) {
                const room = rooms.find((r) => Number(r.id) === Number(item.roomId));
                expectedByClinicianId.set(Number(item.clinicianId), {
                    roomId: Number(item.roomId),
                    roomName: room ? String(room.name) : null,
                    status: "allocated",
                });
            }

            if (groundFloorRoom && groundFloorClinician) {
                expectedByClinicianId.set(Number(groundFloorClinician.id), {
                    roomId: Number(groundFloorRoom.id),
                    roomName: String(groundFloorRoom.name),
                    status: "ground-floor",
                });
            }

            let status: PreviewStatus = "unset";
            let roomId: number | null = null;
            let roomName: string | null = null;
            const activityCode: string | null = requestedRule?.activity_code ?? null;

            if (!requestedRule) {
                status = "unset";
            } else if (isNonWorkingActivity(requestedRule.activity_code)) {
                status = "non-working";
            } else if (isSupportFloorActivity(requestedRule.activity_code)) {
                status = "support-floor";
            } else if (isStoreGeneralActivity(requestedRule.activity_code)) {
                status = "store-general";
            } else if (isAdminActivity(requestedRule.activity_code)) {
                status = "admin";
            } else if (isGroundFloorActivity(requestedRule.activity_code)) {
                status = "ground-floor";
                roomId = groundFloorRoom ? Number(groundFloorRoom.id) : null;
                roomName = groundFloorRoom ? String(groundFloorRoom.name) : "Ground Floor";
            } else {
                const expected = expectedByClinicianId.get(clinicianId);

                if (expected) {
                    status = expected.status;
                    roomId = expected.roomId;
                    roomName = expected.roomName;
                } else {
                    status = "unallocated";
                }
            }

            previews.push({
                weekday,
                activity_code: activityCode,
                status,
                roomId,
                roomName,
                label: buildPreviewLabel(status, roomName),
            });
        }

        return NextResponse.json({
            clinician_id: clinicianId,
            date: asOfDate,
            pattern,
            previews,
        });
    } catch (error) {
        console.error("[day-rules allocations GET] error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}