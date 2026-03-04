"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SuccessToast from "./SuccessToast";
import ErrorModal from "./ErrorModal";

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

function isPastYmd(dateYmd: string) {
    if (!dateYmd || dateYmd.length !== 10) return false;
    const today = ymd(new Date());
    return dateYmd < today; // YYYY-MM-DD lexicographic compare is safe
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

    // ✅ Error modal state
    const [errorOpen, setErrorOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // ✅ Success toast
    const [successOpen, setSuccessOpen] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    // ✅ searchable select state
    const [clinicianQuery, setClinicianQuery] = useState("");
    const [pickerOpen, setPickerOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement | null>(null);

    const clinicianOptions = useMemo(() => {
        const list = (clinicians ?? []).map((c) => {
            const full = String(c.full_name ?? "").trim();
            const display = String(c.display_name ?? "").trim();

            // ✅ show full name (fallback to display)
            const label = full || display || `Clinician ${c.id}`;

            // ✅ searchable by BOTH full + display
            const search = `${full} ${display}`.trim().toLowerCase();

            return { id: Number(c.id), label, search };
        });

        return list.sort((a, b) => a.label.localeCompare(b.label));
    }, [clinicians]);

    const filteredClinicians = useMemo(() => {
        const q = clinicianQuery.trim().toLowerCase();
        if (!q) return clinicianOptions.slice(0, 50);
        return clinicianOptions.filter((c) => c.search.includes(q)).slice(0, 50);
    }, [clinicianQuery, clinicianOptions]);

    async function refreshAfterWrite() {
        try {
            if (onRefresh) await onRefresh();
            else router.refresh();
        } catch {
            router.refresh();
        }
    }

    function showError(msg: string) {
        setErrorMsg(msg);
        setErrorOpen(true);
    }

    function resetForm() {
        setHolidayClinicianId("");
        setClinicianQuery(""); // ✅ placeholder shows
        setPickerOpen(false);

        setHolidayDate(ymd(new Date()));
        setHolidayNote("");

        setHolidayBusy(false);
        setErrorMsg("");
        setErrorOpen(false);
    }

    // ✅ reset when modal opens
    useEffect(() => {
        if (open) resetForm();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // ✅ close picker on outside click + Escape
    useEffect(() => {
        if (!open) return;

        function onDocMouseDown(e: MouseEvent) {
            if (!pickerRef.current) return;
            if (!pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
        }
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setPickerOpen(false);
        }

        document.addEventListener("mousedown", onDocMouseDown);
        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("mousedown", onDocMouseDown);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    function pickClinician(id: number) {
        setHolidayClinicianId(String(id));
        const label = clinicianOptions.find((c) => c.id === id)?.label ?? "";
        setClinicianQuery(label);
        setPickerOpen(false);
    }

    async function addHoliday() {
        const clinicianId = Number(holidayClinicianId);

        if (!Number.isFinite(clinicianId) || clinicianId <= 0) {
            showError("Please select a clinician.");
            return;
        }
        if (!holidayDate || holidayDate.length !== 10) {
            showError("Please pick a valid date.");
            return;
        }
        if (isPastYmd(holidayDate)) {
            showError("You can’t book holiday in the past. Please choose today or a future date.");
            return;
        }

        setHolidayBusy(true);

        try {
            const res = await fetch(`/planner/api/clinicians/${clinicianId}/holidays`, {
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

            const who = clinicianOptions.find((c) => c.id === clinicianId)?.label ?? "Clinician";
            const niceDate = new Date(holidayDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });

            setSuccessMsg(`Holiday recorded for ${who} (${niceDate}).`);
            setSuccessOpen(true);
            onClose();
        } catch (e: any) {
            showError(e?.message ?? "Failed to add holiday");
        } finally {
            setHolidayBusy(false);
        }
    }

    async function removeHoliday() {
        const clinicianId = Number(holidayClinicianId);

        if (!Number.isFinite(clinicianId) || clinicianId <= 0) {
            showError("Please select a clinician.");
            return;
        }
        if (!holidayDate || holidayDate.length !== 10) {
            showError("Please pick a valid date.");
            return;
        }
        if (isPastYmd(holidayDate)) {
            showError("You can’t modify holidays in the past.");
            return;
        }

        setHolidayBusy(true);

        try {
            const res = await fetch(
                `/planner/api/clinicians/${clinicianId}/holidays?date=${encodeURIComponent(holidayDate)}`,
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

            const who = clinicianOptions.find((c) => c.id === clinicianId)?.label ?? "Clinician";
            const niceDate = new Date(holidayDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });

            setSuccessMsg(`Holiday removed for ${who} (${niceDate}).`);
            setSuccessOpen(true);
            onClose();
        } catch (e: any) {
            showError(e?.message ?? "Failed to remove holiday");
        } finally {
            setHolidayBusy(false);
        }
    }

    return (
        <>
            <SuccessToast
                open={successOpen}
                title="Holiday updated"
                message={successMsg}
                onClose={() => setSuccessOpen(false)}
            />

            <ErrorModal
                open={errorOpen}
                title="Holiday update failed"
                message={errorMsg}
                onClose={() => setErrorOpen(false)}
            />

            {!open ? null : (
                <div className="fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-black/30 dark:bg-black/60"
                        onClick={() => !holidayBusy && onClose()}
                    />

                    <div className="absolute left-1/2 top-24 w-[560px] max-w-[calc(100vw-24px)] -translate-x-1/2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add Holiday</div>
                            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Choose a clinician and date.</div>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* ✅ Searchable Clinician Picker */}
                            <div className="grid grid-cols-1 gap-2" ref={pickerRef}>
                                <label className="text-xs font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400">
                                    Clinician
                                </label>

                                <div className="relative">
                                    <input
                                        type="text"
                                        value={clinicianQuery}
                                        onChange={(e) => {
                                            setClinicianQuery(e.target.value);
                                            setPickerOpen(true);
                                            setHolidayClinicianId(""); // clear until user picks
                                        }}
                                        onFocus={() => setPickerOpen(true)}
                                        placeholder="Search clinician…"
                                        className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/30"
                                        disabled={holidayBusy}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setPickerOpen((v) => !v)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                                        disabled={holidayBusy}
                                        aria-label="Toggle clinician list"
                                        title="Toggle list"
                                    >
                                        ▾
                                    </button>

                                    {pickerOpen && (
                                        <div className="absolute z-10 mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
                                            <div className="max-h-60 overflow-y-auto">
                                                {filteredClinicians.length === 0 ? (
                                                    <div className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">No matches</div>
                                                ) : (
                                                    filteredClinicians.map((c) => (
                                                        <button
                                                            type="button"
                                                            key={c.id}
                                                            onClick={() => pickClinician(c.id)}
                                                            className="w-full text-left px-3 py-2 text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                                                        >
                                                            <span className="truncate">{c.label}</span>
                                                            {String(c.id) === holidayClinicianId && (
                                                                <span className="ml-3 text-emerald-600 dark:text-emerald-400 font-semibold">✓</span>
                                                            )}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {!holidayClinicianId && (
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        Select a clinician from the results to confirm.
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                <label className="text-xs font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400">Date</label>
                                <input
                                    type="date"
                                    value={holidayDate}
                                    min={ymd(new Date())} // ✅ stop past selection
                                    onChange={(e) => setHolidayDate(e.target.value)}
                                    className="h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/30"
                                    disabled={holidayBusy}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                <label className="text-xs font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400">
                                    Note (optional)
                                </label>
                                <input
                                    type="text"
                                    value={holidayNote}
                                    onChange={(e) => setHolidayNote(e.target.value)}
                                    className="h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/30"
                                    placeholder="e.g. Annual leave"
                                    disabled={holidayBusy}
                                />
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={holidayBusy}
                                className="h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
                            >
                                Close
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={removeHoliday}
                                    disabled={holidayBusy || !holidayClinicianId}
                                    className="h-10 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-4 text-sm font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/45 disabled:opacity-60"
                                >
                                    Remove
                                </button>
                                <button
                                    type="button"
                                    onClick={addHoliday}
                                    disabled={holidayBusy || !holidayClinicianId}
                                    className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                                >
                                    {holidayBusy ? "Saving…" : "Add / Update"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}