"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type ClinicianLite = {
    id: number;
    display_name?: string | null;
    full_name?: string | null;
};

function ymd(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export default function AddHolidayModal({
                                            open,
                                            onClose,
                                            clinicians,
                                            onRefresh,
                                        }: {
    open: boolean;
    onClose: () => void;
    clinicians: ClinicianLite[];
    onRefresh?: () => void | Promise<void>;
}) {
    const router = useRouter();

    const [holidayClinicianId, setHolidayClinicianId] = useState<string>("");
    const [holidayDate, setHolidayDate] = useState<string>(() => ymd(new Date()));
    const [holidayNote, setHolidayNote] = useState<string>("");
    const [holidayBusy, setHolidayBusy] = useState(false);
    const [holidayMsg, setHolidayMsg] = useState<string>("");

    const clinicianOptions = useMemo(() => {
        const list = (clinicians ?? []).map((c) => ({
            id: Number(c.id),
            label: String(c.display_name ?? c.full_name ?? `Clinician ${c.id}`),
        }));
        return list.sort((a, b) => a.label.localeCompare(b.label));
    }, [clinicians]);

    async function refreshAfterWrite() {
        try {
            if (onRefresh) await onRefresh();
            else router.refresh();
        } catch {
            router.refresh();
        }
    }

    function ensureDefaults() {
        setHolidayMsg("");
        setHolidayDate(ymd(new Date()));
        setHolidayNote("");

        if (holidayClinicianId === "" && clinicianOptions.length > 0) {
            setHolidayClinicianId(String(clinicianOptions[0].id));
        }
    }

    async function addHoliday() {
        const clinicianId = Number(holidayClinicianId);
        if (!Number.isFinite(clinicianId) || clinicianId <= 0) {
            setHolidayMsg("Please select a clinician.");
            return;
        }
        if (!holidayDate || holidayDate.length !== 10) {
            setHolidayMsg("Please pick a valid date.");
            return;
        }

        setHolidayBusy(true);
        setHolidayMsg("");

        try {
            // ✅ correct API path
            const res = await fetch(`/api/clinicians/${clinicianId}/holidays`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date: holidayDate, note: holidayNote || null }),
            });

            const text = await res.text();
            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try {
                    const j = JSON.parse(text);
                    msg = j?.error ?? msg;
                } catch {
                    if (text) msg = text;
                }
                throw new Error(msg);
            }

            await refreshAfterWrite();
            onClose(); // ✅ close on success
        } catch (e: any) {
            setHolidayMsg(e?.message ?? "Failed to add holiday");
        } finally {
            setHolidayBusy(false);
        }
    }

    useEffect(() => {
        if (open) {
            ensureDefaults();
        }
    }, [open]);

    async function removeHoliday() {
        const clinicianId = Number(holidayClinicianId);
        if (!Number.isFinite(clinicianId) || clinicianId <= 0) {
            setHolidayMsg("Please select a clinician.");
            return;
        }
        if (!holidayDate || holidayDate.length !== 10) {
            setHolidayMsg("Please pick a valid date.");
            return;
        }

        setHolidayBusy(true);
        setHolidayMsg("");

        try {
            // ✅ correct API path
            const res = await fetch(
                `/api/clinicians/${clinicianId}/holidays?date=${encodeURIComponent(holidayDate)}`,
                { method: "DELETE" }
            );

            const text = await res.text();
            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try {
                    const j = JSON.parse(text);
                    msg = j?.error ?? msg;
                } catch {
                    if (text) msg = text;
                }
                throw new Error(msg);
            }

            await refreshAfterWrite();
            onClose(); // ✅ close on success
        } catch (e: any) {
            setHolidayMsg(e?.message ?? "Failed to remove holiday");
        } finally {
            setHolidayBusy(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div
                className="absolute inset-0 bg-black/30"
                onClick={() => !holidayBusy && onClose()}
            />

            <div className="absolute left-1/2 top-24 w-[560px] max-w-[calc(100vw-24px)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="p-5 border-b border-slate-200">
                    <div className="text-lg font-semibold text-slate-900">Add Holiday</div>
                    <div className="mt-1 text-sm text-slate-600">Choose a clinician and date.</div>
                </div>

                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                        <label className="text-xs font-semibold tracking-wide uppercase text-slate-600">
                            Clinician
                        </label>
                        <select
                            value={holidayClinicianId}
                            onChange={(e) => setHolidayClinicianId(e.target.value)}
                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                            disabled={holidayBusy}
                        >
                            <option value="">Select clinician…</option>
                            {clinicianOptions.map((c) => (
                                <option key={c.id} value={String(c.id)}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <label className="text-xs font-semibold tracking-wide uppercase text-slate-600">
                            Date
                        </label>
                        <input
                            type="date"
                            value={holidayDate}
                            onChange={(e) => setHolidayDate(e.target.value)}
                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                            disabled={holidayBusy}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <label className="text-xs font-semibold tracking-wide uppercase text-slate-600">
                            Note (optional)
                        </label>
                        <input
                            type="text"
                            value={holidayNote}
                            onChange={(e) => setHolidayNote(e.target.value)}
                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                            placeholder="e.g. Annual leave"
                            disabled={holidayBusy}
                        />
                    </div>

                    {holidayMsg && <div className="text-sm font-medium text-slate-700">{holidayMsg}</div>}
                </div>

                <div className="p-5 border-t border-slate-200 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={holidayBusy}
                        className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                        Close
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={removeHoliday}
                            disabled={holidayBusy}
                            className="h-10 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                        >
                            Remove
                        </button>
                        <button
                            type="button"
                            onClick={addHoliday}
                            disabled={holidayBusy}
                            className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                        >
                            {holidayBusy ? "Saving…" : "Add / Update"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}