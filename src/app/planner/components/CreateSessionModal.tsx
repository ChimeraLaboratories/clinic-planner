"use client";

import { useMemo, useState } from "react";
import ErrorModal from "@/app/planner/components/ErrorModal";
import { matchesPattern } from "../utils/date";

type Slot = "AM" | "PM" | "FULL";
type SessionType = "ST" | "CL" | "OTHER";
type Status = "DRAFT" | "PUBLISHED" | "CANCELLED";

// role_code: 1 = OO, 2 = CLO
type Clinician = {
    id: number;
    full_name?: string | null;
    display_name?: string | null;
    role_code?: number | null;
};

// Minimal DayRule shape (only what we need)
type DayRule = {
    clinician_id: number;
    weekday: number; // 0..6
    is_available_shift?: number | null;
    pattern_code?: string | number | null;
};

function parseYMDToLocalDate(ymd: string) {
    const y = Number(ymd.slice(0, 4));
    const m = Number(ymd.slice(5, 7));
    const d = Number(ymd.slice(8, 10));
    return new Date(y, m - 1, d);
}

function clinicianLabel(c: any) {
    return (
        String(c?.full_name ?? c?.display_name ?? c?.name ?? "").trim() ||
        `Clinician ${String(c?.id ?? "")}`
    );
}

export default function CreateSessionModal({
                                               rooms,
                                               clinicians,
                                               dayRules,
                                               defaults,
                                               onClose,
                                               onCreated,
                                           }: {
    rooms: { id: number; name: string }[];
    clinicians: Clinician[];
    dayRules?: DayRule[];
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

    const [clinician_id, setClinicianId] = useState<number | null>(null);
    const [session_type, setSessionType] = useState<SessionType>("ST");
    const status: Status = "DRAFT";
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [isOvertime, setIsOvertime] = useState(false);

    const selectedClinician = useMemo(() => {
        if (clinician_id == null) return null;
        return clinicians.find((c) => c.id === clinician_id) ?? null;
    }, [clinician_id, clinicians]);

    const isCLO = (selectedClinician?.role_code ?? 0) === 2;

    const allCliniciansSorted = useMemo(() => {
        return [...clinicians].sort((a, b) =>
            clinicianLabel(a).localeCompare(clinicianLabel(b))
        );
    }, [clinicians]);

    // When overtime is checked, ignore day rules and show everyone.
    const eligibleClinicians = useMemo(() => {
        if (isOvertime) return allCliniciansSorted;

        const rules = dayRules ?? [];

        // If rules are not loaded, don't block selection
        if (rules.length === 0) {
            return allCliniciansSorted;
        }

        const dateObj = parseYMDToLocalDate(session_date);
        const weekday = dateObj.getDay(); // 0..6

        const byClinician = new Map<number, DayRule[]>();
        for (const r of rules as any[]) {
            const cid = Number((r as any).clinician_id);
            if (!Number.isFinite(cid)) continue;
            const arr = byClinician.get(cid) ?? [];
            arr.push(r as DayRule);
            byClinician.set(cid, arr);
        }

        const out: Clinician[] = [];

        for (const c of clinicians as any[]) {
            const cRules = byClinician.get(Number(c.id)) ?? [];

            const ok = cRules.some((r: any) => {
                if (Number(r.weekday) !== weekday) return false;
                if (Number(r.is_available_shift ?? 0) !== 1) return false;
                return matchesPattern(r.pattern_code, dateObj);
            });

            if (ok) out.push(c as Clinician);
        }

        return out.sort((a, b) =>
            clinicianLabel(a).localeCompare(clinicianLabel(b))
        );
    }, [allCliniciansSorted, clinicians, dayRules, session_date, isOvertime]);

    async function save() {
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
                is_overtime: isOvertime ? 1 : 0,
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
                <div
                    className="absolute inset-0 bg-black/40 dark:bg-black/60"
                    onClick={onClose}
                />

                <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-950 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
                    <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                        <div>
                            <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                Create session
                            </div>
                            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Assign a clinician and set the session type.
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="px-6 py-5">
                        <div className="grid gap-4">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                Clinician <span className="text-red-600 dark:text-red-400">*</span>
                                <select
                                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-slate-100 shadow-sm outline-none transition focus:border-slate-400 dark:focus:border-slate-600 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800"
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
                                    <option value="" disabled>
                                        Select clinician…
                                    </option>

                                    {eligibleClinicians.map((c: any) => (
                                        <option key={c.id} value={c.id}>
                                            {clinicianLabel(c)}
                                        </option>
                                    ))}
                                </select>

                                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {isOvertime ? (
                                        <>Overtime is enabled, so day rules are ignored.</>
                                    ) : (
                                        <>
                                            Selecting a CLO automatically sets Type to{" "}
                                            <span className="font-semibold">CL</span>.
                                        </>
                                    )}
                                </div>
                            </label>

                            <label className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={isOvertime}
                                    onChange={(e) => setIsOvertime(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700"
                                />
                                <div>
                                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        Overtime?
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Allows this session to ignore clinician day rules.
                                    </div>
                                </div>
                            </label>

                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                Type
                                <select
                                    className={`mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-slate-100 shadow-sm outline-none transition focus:border-slate-400 dark:focus:border-slate-600 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 ${
                                        isCLO
                                            ? "cursor-not-allowed bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400"
                                            : ""
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

                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                Notes{" "}
                                <span className="text-slate-400 dark:text-slate-500 font-normal">
                                    (optional)
                                </span>
                                <input
                                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-slate-100 shadow-sm outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-400 dark:focus:border-slate-600 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add a short note…"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 px-6 py-4">
                        <button
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={save}
                            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
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