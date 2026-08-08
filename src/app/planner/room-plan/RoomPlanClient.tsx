"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Loader2,
    Save,
} from "lucide-react";

type Room = {
    id: number;
    name: string;
    roomType: string;
};

type Clinician = {
    id: number;
    fullName: string;
    roleCode: number;
};

type SavedAssignment = {
    clinicianId: number;
    weekday: number;
    roomId: number;
};

type RoomPlanState = Record<
    number,
    Record<number, number | null>
>;

const WEEKDAYS = [
    { id: 1, label: "Monday", shortLabel: "Mon" },
    { id: 2, label: "Tuesday", shortLabel: "Tue" },
    { id: 3, label: "Wednesday", shortLabel: "Wed" },
    { id: 4, label: "Thursday", shortLabel: "Thu" },
    { id: 5, label: "Friday", shortLabel: "Fri" },
    { id: 6, label: "Saturday", shortLabel: "Sat" },
    { id: 7, label: "Sunday", shortLabel: "Sun" },
];

function getRoomDisplayName(room: Room) {
    switch (room.id) {
        case 1:
            return "ST1";
        case 2:
            return "ST2";
        case 3:
            return "ST3";
        case 4:
            return "ST4";
        case 5:
            return "ST5";
        case 6:
            return "ST6";
        case 7:
            return "ST7";
        case 8:
            return "GF";
        case 9:
            return "CL10";
        case 10:
            return "CL11";
        default:
            return room.name;
    }
}

export default function RoomPlanClient() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [clinicians, setClinicians] = useState<Clinician[]>([]);

    const [plan, setPlan] = useState<RoomPlanState>({});

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const sightTestingRooms = useMemo(
        () =>
            rooms.filter(
                (room) =>
                    room.roomType?.toUpperCase() === "ST",
            ),
        [rooms],
    );

    const contactLensRooms = useMemo(
        () =>
            rooms.filter(
                (room) =>
                    room.roomType?.toUpperCase() === "CL",
            ),
        [rooms],
    );

    useEffect(() => {
        void loadRoomPlan();
    }, []);

    async function loadRoomPlan() {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                "/planner/api/room-plan",
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to load room plan",
                );
            }

            const data = await response.json();

            const loadedRooms = data.rooms as Room[];
            const loadedClinicians =
                data.clinicians as Clinician[];
            const loadedAssignments =
                data.assignments as SavedAssignment[];

            const initialPlan: RoomPlanState = {};

            for (const room of loadedRooms) {
                initialPlan[room.id] = {};

                for (const weekday of WEEKDAYS) {
                    initialPlan[room.id][weekday.id] =
                        null;
                }
            }

            for (const assignment of loadedAssignments) {
                if (!initialPlan[assignment.roomId]) {
                    initialPlan[assignment.roomId] = {};
                }

                initialPlan[assignment.roomId][
                    assignment.weekday
                    ] = assignment.clinicianId;
            }

            setRooms(loadedRooms);
            setClinicians(loadedClinicians);
            setPlan(initialPlan);
        } catch (error) {
            console.error(error);

            setError(
                "Unable to load the room plan.",
            );
        } finally {
            setLoading(false);
        }
    }

    function updateAssignment(
        roomId: number,
        weekday: number,
        clinicianId: number | null,
    ) {
        setSaved(false);

        setPlan((current) => {
            const next: RoomPlanState = {};

            for (const [
                existingRoomId,
                weekdays,
            ] of Object.entries(current)) {
                next[Number(existingRoomId)] = {
                    ...weekdays,
                };
            }

            /*
             * A clinician can only have one normal room
             * on the same weekday.
             */
            if (clinicianId !== null) {
                for (const room of rooms) {
                    if (
                        next[room.id]?.[weekday] ===
                        clinicianId
                    ) {
                        next[room.id][weekday] = null;
                    }
                }
            }

            if (!next[roomId]) {
                next[roomId] = {};
            }

            next[roomId][weekday] = clinicianId;

            return next;
        });
    }

    const assignments = useMemo(() => {
        const result: SavedAssignment[] = [];

        for (const room of rooms) {
            for (const weekday of WEEKDAYS) {
                const clinicianId =
                    plan[room.id]?.[weekday.id];

                if (!clinicianId) {
                    continue;
                }

                result.push({
                    clinicianId,
                    weekday: weekday.id,
                    roomId: room.id,
                });
            }
        }

        return result;
    }, [plan, rooms]);

    async function saveRoomPlan() {
        try {
            setSaving(true);
            setError(null);
            setSaved(false);

            const response = await fetch(
                "/planner/api/room-plan",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        assignments,
                    }),
                },
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to save room plan",
                );
            }

            setSaved(true);
        } catch (error) {
            console.error(error);

            setError(
                "Unable to save the room plan.",
            );
        } finally {
            setSaving(false);
        }
    }

    function renderRoomTable(
        sectionRooms: Room[],
        title: string,
        description: string,
    ) {
        return (
            <div
                className="
                    overflow-hidden
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    shadow-sm
                    dark:border-slate-800
                    dark:bg-slate-950
                    dark:shadow-none
                "
            >
                <div
                    className="
                        border-b
                        border-slate-200
                        px-5
                        py-4
                        dark:border-slate-800
                    "
                >
                    <h2
                        className="
                            text-sm
                            font-bold
                            text-slate-950
                            dark:text-slate-100
                        "
                    >
                        {title}
                    </h2>

                    <p
                        className="
                            mt-1
                            text-xs
                            text-slate-500
                            dark:text-slate-400
                        "
                    >
                        {description}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table
                        className="
                            w-full
                            min-w-[1100px]
                            border-collapse
                        "
                    >
                        <thead>
                        <tr
                            className="
                                    bg-slate-50
                                    dark:bg-slate-900
                                "
                        >
                            <th
                                className="
                                        w-[160px]
                                        border-b
                                        border-r
                                        border-slate-200
                                        px-4
                                        py-3
                                        text-left
                                        text-xs
                                        font-bold
                                        uppercase
                                        tracking-wide
                                        text-slate-600
                                        dark:border-slate-800
                                        dark:text-slate-300
                                    "
                            >
                                Room
                            </th>

                            {WEEKDAYS.map(
                                (weekday) => (
                                    <th
                                        key={
                                            weekday.id
                                        }
                                        className="
                                                border-b
                                                border-r
                                                border-slate-200
                                                px-3
                                                py-3
                                                text-center
                                                text-xs
                                                font-bold
                                                uppercase
                                                tracking-wide
                                                text-slate-600
                                                last:border-r-0
                                                dark:border-slate-800
                                                dark:text-slate-300
                                            "
                                    >
                                        {
                                            weekday.shortLabel
                                        }
                                    </th>
                                ),
                            )}
                        </tr>
                        </thead>

                        <tbody>
                        {sectionRooms.map(
                            (room) => (
                                <tr
                                    key={
                                        room.id
                                    }
                                    className="
                                            last:[&>td]:border-b-0
                                        "
                                >
                                    <td
                                        className="
                                                border-b
                                                border-r
                                                border-slate-200
                                                bg-slate-50/60
                                                px-4
                                                py-3
                                                dark:border-slate-800
                                                dark:bg-slate-900/60
                                            "
                                    >
                                        <div
                                            className="
                                                    font-semibold
                                                    text-slate-900
                                                    dark:text-slate-100
                                                "
                                        >
                                            {getRoomDisplayName(
                                                room,
                                            )}
                                        </div>
                                    </td>

                                    {WEEKDAYS.map(
                                        (
                                            weekday,
                                        ) => {
                                            const selectedClinicianId =
                                                plan[
                                                    room
                                                        .id
                                                    ]?.[
                                                    weekday
                                                        .id
                                                    ] ??
                                                null;

                                            const availableClinicians =
                                                clinicians.filter(
                                                    (
                                                        clinician,
                                                    ) => {
                                                        if (
                                                            room.roomType?.toUpperCase() ===
                                                            "CL"
                                                        ) {
                                                            return (
                                                                clinician
                                                            );
                                                        }

                                                        return (
                                                            clinician
                                                        );
                                                    },
                                                );

                                            return (
                                                <td
                                                    key={
                                                        weekday.id
                                                    }
                                                    className="
                                                            border-b
                                                            border-r
                                                            border-slate-200
                                                            p-2
                                                            last:border-r-0
                                                            dark:border-slate-800
                                                        "
                                                >
                                                    <select
                                                        value={
                                                            selectedClinicianId ??
                                                            ""
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) => {
                                                            const value =
                                                                event
                                                                    .target
                                                                    .value;

                                                            updateAssignment(
                                                                room.id,
                                                                weekday.id,
                                                                value
                                                                    ? Number(
                                                                        value,
                                                                    )
                                                                    : null,
                                                            );
                                                        }}
                                                        className="
                                                                w-full
                                                                rounded-md
                                                                border
                                                                border-slate-300
                                                                bg-white
                                                                px-2
                                                                py-2
                                                                text-sm
                                                                text-slate-900
                                                                outline-none
                                                                transition
                                                                focus:border-slate-500
                                                                focus:ring-2
                                                                focus:ring-slate-200
                                                                dark:border-slate-700
                                                                dark:bg-slate-900
                                                                dark:text-slate-100
                                                                dark:focus:border-slate-500
                                                                dark:focus:ring-slate-800
                                                            "
                                                    >
                                                        <option value="">
                                                            Unassigned
                                                        </option>

                                                        {availableClinicians.map(
                                                            (
                                                                clinician,
                                                            ) => (
                                                                <option
                                                                    key={
                                                                        clinician.id
                                                                    }
                                                                    value={
                                                                        clinician.id
                                                                    }
                                                                >
                                                                    {
                                                                        clinician.fullName
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </td>
                                            );
                                        },
                                    )}
                                </tr>
                            ),
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div
                className="
                    flex
                    min-h-[400px]
                    items-center
                    justify-center
                "
            >
                <div
                    className="
                        flex
                        items-center
                        gap-2
                        text-sm
                        text-slate-600
                        dark:text-slate-300
                    "
                >
                    <Loader2
                        className="
                            h-4
                            w-4
                            animate-spin
                        "
                    />

                    Loading room plan...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div
                className="
                    flex
                    items-start
                    justify-between
                    gap-4
                "
            >
                <div>
                    <h1
                        className="
                            text-2xl
                            font-bold
                            text-slate-950
                            dark:text-slate-100
                        "
                    >
                        Room Plan
                    </h1>

                    <p
                        className="
                            mt-1
                            text-sm
                            text-slate-600
                            dark:text-slate-400
                        "
                    >
                        Set each clinician&apos;s
                        standard room for each day of
                        the week.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={saveRoomPlan}
                    disabled={saving}
                    className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-lg
                        bg-slate-950
                        px-4
                        py-2
                        text-sm
                        font-semibold
                        text-white
                        transition
                        hover:bg-slate-800
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                        dark:bg-slate-100
                        dark:text-slate-950
                        dark:hover:bg-white
                    "
                >
                    {saving ? (
                        <Loader2
                            className="
                                h-4
                                w-4
                                animate-spin
                            "
                        />
                    ) : (
                        <Save
                            className="
                                h-4
                                w-4
                            "
                        />
                    )}

                    {saving
                        ? "Saving..."
                        : "Save room plan"}
                </button>
            </div>

            {error && (
                <div
                    className="
                        rounded-lg
                        border
                        border-red-200
                        bg-red-50
                        px-4
                        py-3
                        text-sm
                        text-red-800
                        dark:border-red-900/60
                        dark:bg-red-950/30
                        dark:text-red-200
                    "
                >
                    {error}
                </div>
            )}

            {saved && (
                <div
                    className="
                        rounded-lg
                        border
                        border-emerald-200
                        bg-emerald-50
                        px-4
                        py-3
                        text-sm
                        text-emerald-800
                        dark:border-emerald-900/60
                        dark:bg-emerald-950/30
                        dark:text-emerald-200
                    "
                >
                    Room plan saved.
                </div>
            )}

            <div className="space-y-6">
                {renderRoomTable(
                    sightTestingRooms,
                    "Sight Testing Rooms",
                    "Standard weekday room allocation for Optometrists.",
                )}

                {renderRoomTable(
                    contactLensRooms,
                    "Contact Lens Rooms",
                    "Standard weekday room allocation for Contact Lens Opticians.",
                )}
            </div>
        </div>
    );
}