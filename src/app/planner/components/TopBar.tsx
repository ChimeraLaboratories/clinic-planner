"use client";

import { formatMonthTitle } from "../utils/date";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function formatLastSynced(d: Date | null | undefined) {
    if (!d) return "";
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function ymd(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

type ClinicianLite = {
    id: number;
    display_name?: string | null;
    full_name?: string | null;
};

export default function TopBar({
                                   anchorMonth,
                                   onPrevMonth,
                                   onNextMonth,
                                   onCurrentMonth,
                                   env,
                                   syncState,
                                   lastSyncedAt,

                                   // ✅ NEW: provide clinicians so user can pick the OO (names don't include "OO")
                                   clinicians,
                                   onRefresh,
                               }: {
    anchorMonth: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onCurrentMonth: () => void;
    env?: "DEV" | "QA" | "STAGE" | "PROD";
    syncState?: "idle" | "syncing" | "synced" | "error";
    lastSyncedAt?: Date | null;

    clinicians: ClinicianLite[];
    onRefresh?: () => void | Promise<void>;
}) {
    const router = useRouter();
    const today = new Date();

    const isCurrentMonth =
        today.getMonth() === anchorMonth.getMonth() && today.getFullYear() === anchorMonth.getFullYear();

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    // ✅ Holiday modal state
    const [holidayOpen, setHolidayOpen] = useState(false);
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
        // stable sort by label
        return list.sort((a, b) => a.label.localeCompare(b.label));
    }, [clinicians]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function refreshAfterWrite() {
        try {
            if (onRefresh) await onRefresh();
            else router.refresh();
        } catch {
            router.refresh();
        }
    }

    function openHolidayModal() {
        setHolidayMsg("");
        setHolidayDate(ymd(new Date()));
        setHolidayNote("");

        // default to first option if none selected
        if (holidayClinicianId === "" && clinicianOptions.length > 0) {
            setHolidayClinicianId(String(clinicianOptions[0].id));
        }

        setHolidayOpen(true);
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
            const res = await fetch(`/planner/api/clinicians/${clinicianId}/holidays`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date: holidayDate, note: holidayNote || null }),
            });

            const text = await res.text(); // ✅ read raw response once

            if (!res.ok) {
                // try JSON, fallback to plain text / HTML
                let msg = `HTTP ${res.status}`;
                try {
                    const j = JSON.parse(text);
                    msg = j?.error ?? msg;
                } catch {
                    if (text) msg = text;
                }
                throw new Error(msg);
            }

            setHolidayMsg("Holiday saved.");
            await refreshAfterWrite();
            setHolidayOpen(false);
        } catch (e: any) {
            setHolidayMsg(e?.message ?? "Failed to add holiday");
        } finally {
            setHolidayBusy(false);
        }
    }

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
            const res = await fetch(
                `/planner/api/clinicians/${clinicianId}/holidays?date=${encodeURIComponent(holidayDate)}`,
                { method: "DELETE" }
            );

            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.error || "Failed to remove holiday");
            }

            setHolidayMsg("Holiday removed.");
            await refreshAfterWrite();
        } catch (e: any) {
            setHolidayMsg(e?.message ?? "Failed to remove holiday");
        } finally {
            setHolidayBusy(false);
        }
    }

    return (
        <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                {/* LEFT — Logo + Brand */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
                        <img src="/logo.svg" alt="Clinic Planner" className="h-10 w-10" />
                    </div>

                    <div className="flex flex-col leading-tight">
                        <div className="flex items-center gap-2">
                            <div className="font-semibold text-slate-900">Clinic Planner</div>

                            {env && (
                                <div className="tooltip">
                  <span
                      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide border ${
                          env === "PROD"
                              ? "bg-red-50 text-red-700 border-red-200 env-glow-prod"
                              : env === "STAGE"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : env === "QA"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                      aria-label={`Environment: ${env}`}
                  >
                    {env === "QA" && (
                        <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500/60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-600" />
                      </span>
                    )}

                      {env === "PROD" && <span className="inline-flex h-2 w-2 rounded-full bg-red-600" />}

                      {env}
                  </span>

                                    <div className="tooltip-content">
                                        <div className="font-semibold text-slate-800">Environment: {env}</div>
                                        <div className="mt-1 text-slate-600">
                                            {env === "PROD"
                                                ? "Live system. Changes affect real schedules."
                                                : env === "QA"
                                                    ? "Testing environment. Data may reset."
                                                    : env === "STAGE"
                                                        ? "Pre-production. Validate before going live."
                                                        : "Development environment. Safe for experiments."}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* CENTER — Month Navigation */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onPrevMonth}
                        className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                    >
                        ‹
                    </button>

                    <div className="flex h-9 items-center overflow-hidden rounded-lg border border-slate-200 bg-white px-5 shadow-sm">
            <span key={formatMonthTitle(anchorMonth)} className="animate-fadeInUp text-sm font-semibold text-slate-800">
              {formatMonthTitle(anchorMonth)}
            </span>
                    </div>

                    <button
                        onClick={onNextMonth}
                        className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                    >
                        ›
                    </button>

                    <button
                        onClick={onCurrentMonth}
                        disabled={isCurrentMonth}
                        className={`ml-2 h-9 rounded-lg px-4 text-sm font-medium shadow-sm transition ${
                            isCurrentMonth
                                ? "cursor-default border border-slate-200 bg-slate-100 text-slate-400"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                        Current Month
                    </button>
                </div>

                {/* 🔄 Live Sync Indicator */}
                {syncState && syncState !== "idle" && (
                    <div
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${
                            syncState === "syncing"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : syncState === "synced"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                        }`}
                        title={lastSyncedAt ? `Last synced at ${formatLastSynced(lastSyncedAt)}` : undefined}
                    >
            <span
                className={`h-2 w-2 rounded-full ${
                    syncState === "syncing"
                        ? "bg-blue-600 animate-pulse"
                        : syncState === "synced"
                            ? "bg-emerald-600"
                            : "bg-red-600"
                }`}
            />
                        {syncState === "syncing" ? "Syncing…" : syncState === "synced" ? "Synced just now" : "Sync failed"}
                    </div>
                )}

                {/* RIGHT — Actions */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/planner/clinicians"
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        Clinician Management
                    </Link>

                    {/* ✅ Single Holiday button */}
                    <button
                        type="button"
                        onClick={openHolidayModal}
                        className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
                        title="Add/remove a holiday"
                    >
                        Add Holiday
                    </button>

                    {/* 👤 User Dropdown */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen((v) => !v)}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
                                CE
                            </div>
                            <span className="hidden sm:block">Cane</span>
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                                <Link href="/settings" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                    Settings
                                </Link>

                                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                    Account
                                </button>

                                <div className="border-t border-slate-200" />

                                <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50">
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ✅ Holiday modal */}
            {holidayOpen && (
                <div className="fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={() => !holidayBusy && setHolidayOpen(false)}
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
                                        <option key={c.id} value={c.id}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                <label className="text-xs font-semibold tracking-wide uppercase text-slate-600">Date</label>
                                <input
                                    type="date"
                                    value={holidayDate}
                                    onChange={(e) => setHolidayDate(e.target.value)}
                                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                    disabled={holidayBusy}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                <label className="text-xs font-semibold tracking-wide uppercase text-slate-600">Note (optional)</label>
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
                                onClick={() => setHolidayOpen(false)}
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
            )}
        </header>
    );
}