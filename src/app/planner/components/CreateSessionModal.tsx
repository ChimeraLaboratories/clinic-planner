"use client";

import { useState } from "react";

type Slot = "AM" | "PM" | "FULL";
type SessionType = "ST" | "CL" | "OTHER";
type Status = "DRAFT" | "PUBLISHED" | "CANCELLED";

export default function CreateSessionModal({
                                               rooms,
                                               clinicians,
                                               defaults,
                                               onClose,
                                               onCreated,
                                           }: {
    rooms: { id: number; name: string }[];
    clinicians: { id: number; display_name: string }[];
    defaults: { session_date: string; room_id: number; slot: Slot };
    onClose: () => void;
    onCreated: () => void;
}) {
    const [session_date, setSessionDate] = useState(defaults.session_date);
    const [room_id, setRoomId] = useState<number>(defaults.room_id);
    const [slot, setSlot] = useState<Slot>(defaults.slot);

    const [clinician_id, setClinicianId] = useState<number | "">("");
    const [session_type, setSessionType] = useState<SessionType>("ST");
    const [status, setStatus] = useState<Status>("DRAFT");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    async function save() {
        setSaving(true);
        try {
            const res = await fetch("/planner/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_date,
                    room_id,
                    slot,
                    clinician_id: clinician_id === "" ? null : clinician_id,
                    session_type,
                    status,
                    notes: notes.trim() ? notes.trim() : null,
                }),
            });



            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(data.error ?? "Failed to create session");
                return;
            }

            onCreated();
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md rounded-xl bg-white p-4 shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">Create session</div>
                    <button onClick={onClose} className="px-2">
                        ✕
                    </button>
                </div>

                <div className="grid gap-2">
                    <label className="text-sm">
                        Date
                        <input
                            className="mt-1 w-full border rounded p-2"
                            type="date"
                            value={session_date}
                            onChange={(e) => setSessionDate(e.target.value)}
                        />
                    </label>

                    <label className="text-sm">
                        Room
                        <select
                            className="mt-1 w-full border rounded p-2"
                            value={room_id}
                            onChange={(e) => setRoomId(Number(e.target.value))}
                        >
                            {rooms.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="text-sm">
                        Slot
                        <select
                            className="mt-1 w-full border rounded p-2"
                            value={slot}
                            onChange={(e) => setSlot(e.target.value as Slot)}
                        >
                            <option value="FULL">FULL</option>
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                        </select>
                    </label>

                    <label className="text-sm">
                        Clinician (optional)
                        <select
                            className="mt-1 w-full border rounded p-2"
                            value={clinician_id}
                            onChange={(e) => setClinicianId(e.target.value ? Number(e.target.value) : "")}
                        >
                            <option value="">Unassigned</option>
                            {clinicians.map((c: any) => (
                                <option key={c.id} value={c.id}>
                                    {c.display_name ?? c.full_name ?? c.name ?? `Clinician ${c.id}`}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                        <label className="text-sm">
                            Type
                            <select
                                className="mt-1 w-full border rounded p-2"
                                value={session_type}
                                onChange={(e) => setSessionType(e.target.value as SessionType)}
                            >
                                <option value="ST">ST</option>
                                <option value="CL">CL</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                        </label>

                        <label className="text-sm">
                            Status
                            <select
                                className="mt-1 w-full border rounded p-2"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as Status)}
                            >
                                <option value="DRAFT">DRAFT</option>
                                <option value="PUBLISHED">PUBLISHED</option>
                                <option value="CANCELLED">CANCELLED</option>
                            </select>
                        </label>
                    </div>

                    <label className="text-sm">
                        Notes
                        <input
                            className="mt-1 w-full border rounded p-2"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional"
                        />
                    </label>

                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 border rounded p-2"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={save}
                            className="flex-1 rounded p-2 bg-slate-900 text-white hover:bg-slate-800"
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}