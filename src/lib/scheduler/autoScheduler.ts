import { db } from "@/lib/db";
import type {
    AutoScheduleDayResult,
    AutoScheduleMonthResult,
    PatternCode,
    PlannedSession,
    RoomDemand,
    SessionType,
    Slot,
    UnfilledDemand,
    AutoScheduleDebugRow,
} from "./types";

type AnyRow = Record<string, any>;

type SchedulerRuleRow = {
    id: number;
    clinician_id: number;
    weekday: number;
    pattern_code: string | null;
    activity_code: string | null;
    start_time: string | null;
    end_time: string | null;
    effective_from: string | null;
    effective_to: string | null;
    is_active: number;
    is_available_shift: number | null;
    room_id: number | null;
    room_allocation_mode: "AUTO" | "FIXED" | null;
    full_name: string | null;
    display_name: string | null;
    role_code: number | null;
    grade_code: number | null;
    is_supervisor: number | null;
};

function isIsoDate(s: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function toDateOnly(s: string) {
    return new Date(`${s}T00:00:00`);
}

function toIsoDate(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function toComparableYmd(input: any): string | null {
    if (!input) return null;

    if (input instanceof Date && !isNaN(input.getTime())) {
        return toIsoDate(input);
    }

    const s = String(input).trim();

    const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];

    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
        return toIsoDate(parsed);
    }

    return null;
}

function getWeekday(dateYmd: string) {
    return toDateOnly(dateYmd).getDay();
}

const ROTATION_ANCHOR_YMD = "2026-01-05";

function getPatternForDate(dateYmd: string): PatternCode {
    const target = toDateOnly(dateYmd);
    const anchor = toDateOnly(ROTATION_ANCHOR_YMD);

    const diffMs = target.getTime() - anchor.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);

    return Math.abs(diffWeeks % 2) === 0 ? "W1" : "W2";
}

function normalizePattern(input: any): PatternCode {
    const s = String(input ?? "").trim().toUpperCase();

    if (!s) return "EVERY";
    if (s === "EVERY" || s === "ALL" || s === "*") return "EVERY";

    if (s === "W1" || s === "1" || s === "A" || s === "WEEK1" || s === "ODD") return "W1";
    if (s === "W2" || s === "2" || s === "B" || s === "WEEK2" || s === "EVEN") return "W2";

    return "EVERY";
}

function normalizeSlot(input: any): Slot | null {
    const s = String(input ?? "").trim().toUpperCase();
    if (s === "AM" || s === "PM" || s === "FULL") return s;
    return null;
}

function overlapsSlot(a: Slot, b: Slot) {
    if (a === "FULL" || b === "FULL") return true;
    return a === b;
}

function inferSessionTypeFromActivity(activityCode: string | null | undefined): SessionType | null {
    const s = String(activityCode ?? "").trim().toUpperCase();

    if (!s) return null;

    if (
        s === "TESTING" ||
        s === "ST" ||
        s === "GF_DAY" ||
        s === "GF" ||
        s === "GROUND_FLOOR" ||
        s.includes("TEST")
    ) {
        return "ST";
    }

    if (
        s === "CL" ||
        s === "CLINIC" ||
        s.includes("CL")
    ) {
        return "CL";
    }

    return null;
}

function inferSlotFromTimes(start: string | null | undefined, end: string | null | undefined): Slot {
    const s = start ? String(start) : null;
    const e = end ? String(end) : null;

    if (!s || !e) return "FULL";
    if (s >= "00:00:00" && e <= "13:00:00") return "AM";
    if (s >= "12:00:00") return "PM";
    return "FULL";
}

async function getRoomMap() {
    const [rooms] = await db.query(
        `
            SELECT id, name
            FROM rooms
            WHERE is_active = 1
        `
    );

    const map = new Map<number, string>();
    for (const r of rooms as AnyRow[]) {
        map.set(Number(r.id), String(r.name ?? `Room ${r.id}`));
    }
    return map;
}

async function getExistingSessions(dateYmd: string) {
    const [rows] = await db.query(
        `
            SELECT
                id,
                room_id,
                clinician_id,
                session_type,
                slot,
                status,
                notes
            FROM sessions
            WHERE DATE(session_date) = ?
              AND status <> 'CANCELLED'
        `,
        [dateYmd]
    );

    return rows as AnyRow[];
}

async function deleteAutoDraftSessionsForDate(dateYmd: string) {
    await db.query(
        `
            DELETE FROM sessions
            WHERE DATE(session_date) = ?
          AND status = 'DRAFT'
          AND COALESCE(notes, '') LIKE '%[AUTO-SCHEDULER]%'
        `,
        [dateYmd]
    );
}

async function getHolidayClinicianIds(dateYmd: string): Promise<Set<number>> {
    try {
        const [rows] = await db.query(
            `
                SELECT DISTINCT clinician_id
                FROM clinician_holiday
                WHERE ? BETWEEN DATE(date_from) AND DATE(date_to)
            `,
            [dateYmd]
        );

        return new Set((rows as AnyRow[]).map((r) => Number(r.clinician_id)).filter(Boolean));
    } catch {
        return new Set();
    }
}

async function getRuleRowsForDate(dateYmd: string): Promise<{
    rows: SchedulerRuleRow[];
    debugRows: AutoScheduleDebugRow[];
}> {
    const weekday = getWeekday(dateYmd);
    const pattern = getPatternForDate(dateYmd);
    const holidayIds = await getHolidayClinicianIds(dateYmd);

    const [rows] = await db.query(
        `
            SELECT
                r.id,
                r.clinician_id,
                r.weekday,
                r.pattern_code,
                r.activity_code,
                r.start_time,
                r.end_time,
                r.effective_from,
                r.effective_to,
                r.is_active,
                r.is_available_shift,
                r.room_id,
                r.room_allocation_mode,
                c.full_name,
                c.display_name,
                c.role_code,
                c.grade_code,
                c.is_supervisor
            FROM clinician_day_rule r
                     INNER JOIN clinicians c
                                ON c.id = r.clinician_id
            WHERE r.is_active = 1
              AND c.is_active = 1
              AND r.weekday = ?
              AND r.is_available_shift = 1
              AND (
                r.room_id IS NOT NULL
                    OR UPPER(COALESCE(r.room_allocation_mode, '')) = 'AUTO'
                )
            ORDER BY
                CASE
                    WHEN UPPER(COALESCE(r.room_allocation_mode, '')) = 'FIXED' THEN 0
                    WHEN UPPER(COALESCE(r.room_allocation_mode, '')) = 'AUTO' THEN 1
                    ELSE 2
                    END,
                COALESCE(r.room_id, 999999),
                r.clinician_id,
                r.id
        `,
        [weekday]
    );

    const out: SchedulerRuleRow[] = [];
    const debugRows: AutoScheduleDebugRow[] = [];

    for (const row of rows as AnyRow[]) {
        const clinicianId = Number(row.clinician_id);
        const clinicianName = row.display_name ?? row.full_name ?? `Clinician ${clinicianId}`;

        const rowPattern = normalizePattern(row.pattern_code);
        const effectiveFrom = toComparableYmd(row.effective_from);
        const effectiveTo = toComparableYmd(row.effective_to);
        const derivedSessionType = inferSessionTypeFromActivity(row.activity_code);
        const derivedSlot = inferSlotFromTimes(row.start_time, row.end_time);

        let included = true;
        let reason = "included";

        if (!clinicianId) {
            included = false;
            reason = "invalid clinician_id";
        } else if (holidayIds.has(clinicianId)) {
            included = false;
            reason = "clinician on holiday";
        } else if (!(rowPattern === "EVERY" || rowPattern === pattern)) {
            included = false;
            reason = `pattern mismatch (${rowPattern} !== ${pattern})`;
        } else if (effectiveFrom && dateYmd < effectiveFrom) {
            included = false;
            reason = `before effective_from ${effectiveFrom}`;
        } else if (effectiveTo && dateYmd > effectiveTo) {
            included = false;
            reason = `after effective_to ${effectiveTo}`;
        } else if (!derivedSessionType) {
            included = false;
            reason = `unsupported activity_code ${String(row.activity_code ?? "")}`;
        }

        debugRows.push({
            rule_id: Number(row.id),
            clinician_id: clinicianId,
            clinician_name: clinicianName,
            weekday: Number(row.weekday),
            pattern_code: row.pattern_code ?? null,
            activity_code: row.activity_code ?? null,
            room_id: row.room_id != null ? Number(row.room_id) : null,
            room_allocation_mode: row.room_allocation_mode ?? null,
            is_available_shift: row.is_available_shift != null ? Number(row.is_available_shift) : null,
            effective_from: effectiveFrom,
            effective_to: effectiveTo,
            derived_session_type: derivedSessionType,
            derived_slot: derivedSlot,
            included,
            reason,
        });

        if (!included) continue;

        out.push({
            id: Number(row.id),
            clinician_id: clinicianId,
            weekday: Number(row.weekday),
            pattern_code: row.pattern_code ?? null,
            activity_code: row.activity_code ?? null,
            start_time: row.start_time ?? null,
            end_time: row.end_time ?? null,
            effective_from: effectiveFrom,
            effective_to: effectiveTo,
            is_active: Number(row.is_active ?? 0),
            is_available_shift: row.is_available_shift != null ? Number(row.is_available_shift) : null,
            room_id: row.room_id != null ? Number(row.room_id) : null,
            room_allocation_mode: row.room_allocation_mode ?? null,
            full_name: row.full_name ?? null,
            display_name: row.display_name ?? null,
            role_code: row.role_code != null ? Number(row.role_code) : null,
            grade_code: row.grade_code != null ? Number(row.grade_code) : null,
            is_supervisor: row.is_supervisor != null ? Number(row.is_supervisor) : null,
        });
    }

    return { rows: out, debugRows };
}

function buildDemandKey(roomId: number, slot: Slot, sessionType: SessionType) {
    return `${roomId}:${slot}:${sessionType}`;
}

function buildPhysicalRoomSlotKey(roomId: number, slot: Slot) {
    return `${roomId}:${slot}`;
}

function getAllowedSessionTypesForRoom(roomName: string): SessionType[] {
    const s = String(roomName ?? "").trim().toUpperCase();

    // Special exception: CL Room 10 can be used for CL primarily, but ST if needed
    if (s === "CL ROOM 10") return ["CL", "ST"];

    if (s.startsWith("CL ROOM")) return ["CL"];
    if (s.startsWith("ST ROOM")) return ["ST"];
    if (s.includes("GROUND FLOOR")) return ["ST"];

    return ["ST"];
}

function scoreRuleCandidate(
    row: SchedulerRuleRow,
    demand: RoomDemand,
    usedBySlot: Map<number, Slot[]>
) {
    let score = 0;

    const role = row.role_code ?? 0;
    const grade = row.grade_code ?? 0;
    const supervisor = row.is_supervisor ?? 0;

    if (String(row.room_allocation_mode ?? "").toUpperCase() === "FIXED") score += 1000;

    if (demand.session_type === "ST") {
        if (role === 1) score += 100;
        if (role === 2) score -= 25;
    } else if (demand.session_type === "CL") {
        if (role === 2) score += 100;
        if (role === 1) score -= 25;
    } else {
        score += 10;
    }

    if (grade === 1) score += 20;
    if (grade === 2) score += 5;
    if (supervisor === 1) score += 10;

    const usedSlots = usedBySlot.get(row.clinician_id) ?? [];
    if (usedSlots.some((s) => overlapsSlot(s, demand.slot))) score -= 10000;
    if (usedSlots.length > 0) score -= 10;

    return score;
}

function buildAutoNote(dateYmd: string) {
    return `[AUTO-SCHEDULER] Generated for ${dateYmd}`;
}

function isAutoNoRoom(row: SchedulerRuleRow) {
    return (
        !row.room_id &&
        String(row.room_allocation_mode ?? "").toUpperCase() === "AUTO"
    );
}

function isFixedWithRoom(row: SchedulerRuleRow) {
    return (
        !!row.room_id &&
        String(row.room_allocation_mode ?? "").toUpperCase() === "FIXED"
    );
}

export async function previewAutoScheduleDay(options: {
    date: string;
    overwriteExisting?: boolean;
}): Promise<AutoScheduleDayResult> {
    const dateYmd = String(options.date ?? "").trim();
    const overwriteExisting = Boolean(options.overwriteExisting);

    if (!isIsoDate(dateYmd)) {
        throw new Error("Invalid date");
    }

    const pattern = getPatternForDate(dateYmd);
    const roomMap = await getRoomMap();
    const { rows: ruleRows, debugRows } = await getRuleRowsForDate(dateYmd);
    const existingSessions = await getExistingSessions(dateYmd);

    const warnings: string[] = [];
    const allocations: PlannedSession[] = [];
    const unfilled: UnfilledDemand[] = [];
    const usedBySlot = new Map<number, Slot[]>();

    const occupiedRoomSlots = new Set<string>();
    const physicallyOccupiedRoomSlots = new Set<string>();

    for (const s of existingSessions) {
        const roomId = Number(s.room_id);
        const slot = normalizeSlot(s.slot);
        const clinicianId = Number(s.clinician_id);

        if (roomId && slot) {
            occupiedRoomSlots.add(`${roomId}:${slot}`);
            physicallyOccupiedRoomSlots.add(buildPhysicalRoomSlotKey(roomId, slot));
        }

        if (clinicianId && slot) {
            const curr = usedBySlot.get(clinicianId) ?? [];
            curr.push(slot);
            usedBySlot.set(clinicianId, curr);
        }
    }

    const fixedRows = ruleRows.filter(isFixedWithRoom);
    const autoRows = ruleRows.filter(isAutoNoRoom);

    const fixedBuckets = new Map<string, SchedulerRuleRow[]>();

    for (const row of fixedRows) {
        if (!row.room_id) continue;

        const sessionType = inferSessionTypeFromActivity(row.activity_code);
        if (!sessionType) continue;

        const slot = inferSlotFromTimes(row.start_time, row.end_time);
        const key = buildDemandKey(row.room_id, slot, sessionType);

        if (!fixedBuckets.has(key)) {
            fixedBuckets.set(key, []);
        }

        fixedBuckets.get(key)!.push(row);
    }

    const expandedDemands: Array<{
        demand: RoomDemand;
        candidates: SchedulerRuleRow[];
    }> = [];

    for (const rows of fixedBuckets.values()) {
        const first = rows[0];
        if (!first.room_id) continue;

        const sessionType = inferSessionTypeFromActivity(first.activity_code);
        if (!sessionType) continue;

        const slot = inferSlotFromTimes(first.start_time, first.end_time);

        for (let i = 0; i < rows.length; i++) {
            expandedDemands.push({
                demand: {
                    room_id: first.room_id,
                    room_name: roomMap.get(first.room_id) ?? `Room ${first.room_id}`,
                    slot,
                    session_type: sessionType,
                    priority: 0,
                },
                candidates: [...rows],
            });
        }
    }

    expandedDemands.sort((a, b) => {
        if (a.demand.room_id !== b.demand.room_id) {
            return a.demand.room_id - b.demand.room_id;
        }
        return a.demand.slot.localeCompare(b.demand.slot);
    });

    for (const group of expandedDemands) {
        const demand = group.demand;
        const roomSlotKey = `${demand.room_id}:${demand.slot}`;

        if (!overwriteExisting && occupiedRoomSlots.has(roomSlotKey)) {
            warnings.push(
                `${dateYmd}: ${demand.room_name} ${demand.slot} already has an existing session, skipped`
            );
            continue;
        }

        const scored = group.candidates
            .map((row) => ({
                row,
                score: scoreRuleCandidate(row, demand, usedBySlot),
            }))
            .sort((a, b) => b.score - a.score);

        const best = scored.find((x) => x.score > -1000);

        if (!best) {
            unfilled.push({
                room_id: demand.room_id,
                room_name: demand.room_name,
                slot: demand.slot,
                session_type: demand.session_type,
                reason: "No eligible clinician available",
            });
            continue;
        }

        const chosen = best.row;

        allocations.push({
            date: dateYmd,
            room_id: demand.room_id,
            room_name: demand.room_name,
            clinician_id: chosen.clinician_id,
            clinician_name:
                chosen.display_name || chosen.full_name || `Clinician ${chosen.clinician_id}`,
            session_type: demand.session_type,
            slot: demand.slot,
            notes: buildAutoNote(dateYmd),
        });

        physicallyOccupiedRoomSlots.add(buildPhysicalRoomSlotKey(demand.room_id, demand.slot));

        const curr = usedBySlot.get(chosen.clinician_id) ?? [];
        curr.push(demand.slot);
        usedBySlot.set(chosen.clinician_id, curr);

        group.candidates = group.candidates.filter((r) => r.clinician_id !== chosen.clinician_id);
    }

    const roomSlotCapacity = new Map<string, number>();

    for (const rows of fixedBuckets.values()) {
        const first = rows[0];
        if (!first.room_id) continue;

        const sessionType = inferSessionTypeFromActivity(first.activity_code);
        if (!sessionType) continue;

        const slot = inferSlotFromTimes(first.start_time, first.end_time);
        const roomSlotKey = `${first.room_id}:${slot}`;

        if (!overwriteExisting && occupiedRoomSlots.has(roomSlotKey)) {
            continue;
        }

        const key = buildDemandKey(first.room_id, slot, sessionType);
        roomSlotCapacity.set(key, Math.max(roomSlotCapacity.get(key) ?? 0, rows.length));
    }

    for (const [room_id, room_name] of roomMap.entries()) {
        const slot: Slot = "FULL";
        const physicalKey = buildPhysicalRoomSlotKey(room_id, slot);

        if (physicallyOccupiedRoomSlots.has(physicalKey)) {
            continue;
        }

        const allowedSessionTypes = getAllowedSessionTypesForRoom(room_name);

        for (const sessionType of allowedSessionTypes) {
            const key = buildDemandKey(room_id, slot, sessionType);

            if (!roomSlotCapacity.has(key)) {
                roomSlotCapacity.set(key, 1);
            }
        }
    }

    const roomSlotUsed = new Map<string, number>();
    for (const a of allocations) {
        const key = buildDemandKey(a.room_id, a.slot, a.session_type);
        roomSlotUsed.set(key, (roomSlotUsed.get(key) ?? 0) + 1);
    }

    for (const row of autoRows) {
        const sessionType = inferSessionTypeFromActivity(row.activity_code);
        if (!sessionType) continue;

        const slot = inferSlotFromTimes(row.start_time, row.end_time);

        const usedSlots = usedBySlot.get(row.clinician_id) ?? [];
        if (usedSlots.some((s) => overlapsSlot(s, slot))) {
            warnings.push(
                `${dateYmd}: ${row.display_name || row.full_name || `Clinician ${row.clinician_id}`} is AUTO but already used in overlapping slot`
            );
            continue;
        }

        const candidateKeys = Array.from(roomSlotCapacity.keys()).filter((key) => {
            const [roomIdStr, slotStr, sessionTypeStr] = key.split(":");
            const room_id = Number(roomIdStr);
            const slotValue = slotStr as Slot;
            const sessionTypeValue = sessionTypeStr as SessionType;

            if (slotValue !== slot) return false;
            if (sessionTypeValue !== sessionType) return false;

            const physicalKey = buildPhysicalRoomSlotKey(room_id, slotValue);
            if (physicallyOccupiedRoomSlots.has(physicalKey)) return false;

            const capacity = roomSlotCapacity.get(key) ?? 0;
            const used = roomSlotUsed.get(key) ?? 0;
            if (used >= capacity) return false;

            if (!roomMap.has(room_id)) return false;
            return true;
        });

        if (candidateKeys.length === 0) {
            warnings.push(
                `${dateYmd}: ${row.display_name || row.full_name || `Clinician ${row.clinician_id}`} is AUTO but no free ${sessionType} ${slot} room was available`
            );

            unfilled.push({
                room_id: 0,
                room_name: "AUTO",
                slot,
                session_type: sessionType,
                reason: `${row.display_name || row.full_name || `Clinician ${row.clinician_id}`} could not be placed`,
            });

            continue;
        }

        const chosenKey = candidateKeys.sort((a, b) => {
            const aUsed = roomSlotUsed.get(a) ?? 0;
            const bUsed = roomSlotUsed.get(b) ?? 0;
            if (aUsed !== bUsed) return aUsed - bUsed;
            return a.localeCompare(b);
        })[0];

        const [roomIdStr, slotStr, sessionTypeStr] = chosenKey.split(":");
        const room_id = Number(roomIdStr);
        const chosenSlot = slotStr as Slot;
        const chosenSessionType = sessionTypeStr as SessionType;

        allocations.push({
            date: dateYmd,
            room_id,
            room_name: roomMap.get(room_id) ?? `Room ${room_id}`,
            clinician_id: row.clinician_id,
            clinician_name:
                row.display_name || row.full_name || `Clinician ${row.clinician_id}`,
            session_type: chosenSessionType,
            slot: chosenSlot,
            notes: `${buildAutoNote(dateYmd)} [AUTO-ROOM]`,
        });

        physicallyOccupiedRoomSlots.add(buildPhysicalRoomSlotKey(room_id, chosenSlot));
        roomSlotUsed.set(chosenKey, (roomSlotUsed.get(chosenKey) ?? 0) + 1);

        const curr = usedBySlot.get(row.clinician_id) ?? [];
        curr.push(chosenSlot);
        usedBySlot.set(row.clinician_id, curr);
    }

    return {
        date: dateYmd,
        pattern,
        allocations,
        unfilled,
        warnings,
        stats: {
            requested: expandedDemands.length + autoRows.length,
            allocated: allocations.length,
            unallocated: unfilled.length,
        },
        debug: {
            weekday: getWeekday(dateYmd),
            pattern,
            totalRuleRowsFetched: debugRows.length,
            rowsAfterFiltering: ruleRows.length,
            rows: debugRows,
        },
    };
}

export async function applyAutoScheduleDay(options: {
    date: string;
    overwriteExisting?: boolean;
}) {
    const dateYmd = String(options.date ?? "").trim();
    const overwriteExisting = Boolean(options.overwriteExisting);

    if (!isIsoDate(dateYmd)) {
        throw new Error("Invalid date");
    }

    if (overwriteExisting) {
        await deleteAutoDraftSessionsForDate(dateYmd);
    }

    const result = await previewAutoScheduleDay({
        date: dateYmd,
        overwriteExisting: false,
    });

    if (result.allocations.length === 0) {
        return {
            created: 0,
            result,
        };
    }

    let created = 0;

    for (const item of result.allocations) {
        const [existing] = await db.query(
            `
                SELECT id
                FROM sessions
                WHERE DATE(session_date) = ?
                  AND room_id = ?
                  AND slot = ?
                  AND clinician_id = ?
                  AND status <> 'CANCELLED'
                    LIMIT 1
            `,
            [item.date, item.room_id, item.slot, item.clinician_id]
        );

        if ((existing as AnyRow[]).length > 0) {
            continue;
        }

        await db.query(
            `
                INSERT INTO sessions
                (session_date, room_id, clinician_id, session_type, slot, status, notes)
                VALUES
                    (?, ?, ?, ?, ?, 'DRAFT', ?)
            `,
            [
                item.date,
                item.room_id,
                item.clinician_id,
                item.session_type,
                item.slot,
                item.notes,
            ]
        );

        created += 1;
    }

    return {
        created,
        result,
    };
}

function firstDayOfMonth(monthYmd: string) {
    const d = toDateOnly(`${monthYmd}-01`);
    return toIsoDate(d);
}

function lastDayOfMonth(monthYmd: string) {
    const d = toDateOnly(`${monthYmd}-01`);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return toIsoDate(next);
}

function enumerateDates(from: string, to: string) {
    const out: string[] = [];
    let cursor = toDateOnly(from);
    const end = toDateOnly(to);

    while (cursor.getTime() <= end.getTime()) {
        out.push(toIsoDate(cursor));
        cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    }

    return out;
}

export async function previewAutoScheduleMonth(options: {
    month?: string;
    from?: string;
    to?: string;
    overwriteExisting?: boolean;
}): Promise<AutoScheduleMonthResult> {
    const overwriteExisting = Boolean(options.overwriteExisting);

    let from = String(options.from ?? "").trim();
    let to = String(options.to ?? "").trim();

    if (!from || !to) {
        const month = String(options.month ?? "").trim();
        if (!/^\d{4}-\d{2}$/.test(month)) {
            throw new Error("Invalid month");
        }
        from = firstDayOfMonth(month);
        to = lastDayOfMonth(month);
    }

    if (!isIsoDate(from) || !isIsoDate(to)) {
        throw new Error("Invalid date range");
    }

    const dates = enumerateDates(from, to);
    const days: AutoScheduleDayResult[] = [];

    for (const date of dates) {
        days.push(
            await previewAutoScheduleDay({
                date,
                overwriteExisting,
            })
        );
    }

    return {
        from,
        to,
        days,
        summary: {
            totalDays: days.length,
            totalRequested: days.reduce((n, d) => n + d.stats.requested, 0),
            totalAllocated: days.reduce((n, d) => n + d.stats.allocated, 0),
            totalUnallocated: days.reduce((n, d) => n + d.stats.unallocated, 0),
            totalWarnings: days.reduce((n, d) => n + d.warnings.length, 0),
        },
    };
}

export async function applyAutoScheduleMonth(options: {
    month?: string;
    from?: string;
    to?: string;
    overwriteExisting?: boolean;
}) {
    const preview = await previewAutoScheduleMonth(options);
    let created = 0;

    for (const day of preview.days) {
        const applied = await applyAutoScheduleDay({
            date: day.date,
            overwriteExisting: Boolean(options.overwriteExisting),
        });
        created += applied.created;
    }

    return {
        created,
        result: preview,
    };
}