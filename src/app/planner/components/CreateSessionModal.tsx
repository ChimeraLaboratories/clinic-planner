"use client";

import { useMemo, useState } from "react";
import ErrorModal from "@/app/planner/components/ErrorModal";

type Slot = "AM" | "PM" | "FULL";
type SessionType = "ST" | "CL" | "OTHER";
type Status = "DRAFT" | "PUBLISHED" | "CANCELLED";

// role_code: 1 = OO, 2 = CLO
type Clinician = { id: number; full_name: string; role_code?: number };

export default function CreateSessionModal({
                                               rooms,
                                               clinicians,
                                               defaults,
                                               onClose,
                                               onCreated,
                                           }: {
    rooms: { id: number; name: string }[];
    clinicians: Clinician[];
    defaults: { session_date: string; room_id: number; slot: Slot };
    onClose: () => void;
    onCreated: () => void;
}) {
    // Hidden (context-driven) values
    const [session_date] = useState(defaults.session_date);
    const [room_id] = useState<number>(defaults.room_id);
    const [slot] = useState<Slot>(defaults.slot);

    const [errorOpen, setErrorOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // ✅ clinician now mandatory: use null instead of "" (cleaner)
    const [clinician_id, setClinicianId] = useState<number | null>(null);

    const [session_type, setSessionType] = useState<SessionType>("ST");
    const status: Status = "DRAFT"; // fixed now
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    const selectedClinician = useMemo(() => {
        if (clinician_id == null) return null;
        return clinicians.find((c) => c.id === clinician_id) ?? null;
    }, [clinician_id, clinicians]);

    const isCLO = (selectedClinician?.role_code ?? 0) === 2;

    async function save() {
        // ✅ validation: clinician required
        if (clinician_id == null) {
            setErrorMessage("Please select a clinician.");
            setErrorOpen(true);
            return;
        }

        try {
            setSaving(true);

            const body = {
                session_date,
                room_id,
                clinician_id,
                session_type,
                slot,
                status,
                notes,
            };

            const res = await fetch("/planner/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            let json: any = null;
            try {
                json = await res.json();
            } catch {}

            if (!res.ok) {
                throw new Error(json?.error ?? `HTTP ${res.status}`);
            }

            onCreated?.();
            onClose?.();
        } catch (e: any) {
            console.error(e);
            setErrorMessage(e?.message ?? "Failed to create session");
            setErrorOpen(true);
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* backdrop */}
                <div className="absolute inset-0 bg-black/40" onClick={onClose} />

                {/* modal */}
                <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
                    {/* header */}
                    <div className="flex items-start justify-between border-b px-6 py-4">
                        <div>
                            <div className="text-base font-semibold text-slate-900">Create session</div>
                            <div className="mt-1 text-sm text-slate-500">
                                Assign a clinician and set the session type.
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>

                    {/* body */}
                    <div className="px-6 py-5">
                        <div className="grid gap-4">
                            {/* Clinician */}
                            <label className="text-sm font-medium text-slate-700">
                                Clinician <span className="text-red-600">*</span>
                                <select
                                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                    value={clinician_id ?? ""}
                                    onChange={(e) => {
                                        const nextId = e.target.value ? Number(e.target.value) : null;
                                        setClinicianId(nextId);

                                        if (nextId == null) return;

                                        const selected = clinicians.find((c) => c.id === nextId);

                                        // 2 = CLO -> CL, 1 = OO -> ST
                                        if (selected?.role_code === 2) setSessionType("CL");
                                        else if (selected?.role_code === 1) setSessionType("ST");
                                    }}
                                >
                                    {/* ✅ no Unassigned option */}
                                    <option value="" disabled>
                                        Select clinician…
                                    </option>

                                    {clinicians.map((c: any) => {
                                        const label =
                                            String(c.full_name ?? c.full_name ?? c.name ?? "").trim() ||
                                            `Clinician ${c.id}`;

                                        return (
                                            <option key={c.id} value={c.id}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                                <div className="mt-1 text-xs text-slate-500">
                                    Selecting a CLO automatically sets Type to <span className="font-semibold">CL</span>.
                                </div>
                            </label>

                            {/* Type */}
                            <label className="text-sm font-medium text-slate-700">
                                Type
                                <select
                                    className={`mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 ${
                                        isCLO ? "cursor-not-allowed bg-slate-50 text-slate-500" : ""
                                    }`}
                                    value={session_type}
                                    onChange={(e) => setSessionType(e.target.value as SessionType)}
                                    disabled={isCLO}
                                >
                                    <option value="ST">ST</option>
                                    <option value="CL">CL</option>
                                    <option value="OTHER">OTHER</option>
                                </select>
                            </label>

                            {/* Notes */}
                            <label className="text-sm font-medium text-slate-700">
                                Notes <span className="text-slate-400 font-normal">(optional)</span>
                                <input
                                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add a short note…"
                                />
                            </label>
                        </div>
                    </div>

                    {/* footer */}
                    <div className="flex items-center justify-end gap-3 border-t bg-slate-50 px-6 py-4">
                        <button
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-60"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={save}
                            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                            disabled={saving}
                        >
                            {saving ? "Saving…" : "Save"}
                        </button>
                    </div>
                </div>
            </div>

            <ErrorModal
                open={errorOpen}
                title="Cannot create session"
                message={errorMessage}
                onClose={() => setErrorOpen(false)}
            />
        </>
    );
}