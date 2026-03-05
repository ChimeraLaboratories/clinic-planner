"use client";

import { formatMonthTitle } from "../utils/date";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AddHolidayModal from "./AddHolidayModal";
import Image from "next/image";

function formatLastSynced(d: Date | null | undefined) {
    if (!d) return "";
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

type ClinicianLite = {
    id: number;
    display_name?: string | null;
    full_name?: string | null;
};

type Env = "DEV" | "QA" | "STAGE" | "PROD";

type Meta = {
    env?: Env;
    version?: string | null;
    commit?: string | null;
    buildTime?: string | null;
    region?: string | null;
};

function normalizeEnv(v: any): Env | undefined {
    const s = String(v ?? "").trim().toUpperCase();
    if (s === "DEV" || s === "QA" || s === "STAGE" || s === "PROD") return s as Env;
    return undefined;
}

function getIsDark() {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
}

function setTheme(next: "light" | "dark") {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (next === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
        localStorage.setItem("theme", next);
    } catch {}
}

export default function TopBar({
                                   anchorMonth,
                                   onPrevMonth,
                                   onNextMonth,
                                   onCurrentMonth,
                                   env,
                                   syncState,
                                   lastSyncedAt,
                                   clinicians,
                                   onRefresh,
                               }: {
    anchorMonth: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onCurrentMonth: () => void;
    env?: Env;
    syncState?: "idle" | "syncing" | "synced" | "error";
    lastSyncedAt?: Date | null;
    clinicians: ClinicianLite[];
    onRefresh?: () => void | Promise<void>;
}) {
    const today = new Date();
    const isCurrentMonth =
        today.getMonth() === anchorMonth.getMonth() && today.getFullYear() === anchorMonth.getFullYear();

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const [holidayOpen, setHolidayOpen] = useState(false);

    const [isDark, setIsDark] = useState(false);

    const [runtimeEnv, setRuntimeEnv] = useState<Env | undefined>(env);
    const [meta, setMeta] = useState<Meta | null>(null);

    // Tooltip clamp refs/state
    const badgeRef = useRef<HTMLSpanElement | null>(null);
    const tipRef = useRef<HTMLDivElement | null>(null);
    const [tipShift, setTipShift] = useState(0);

    useEffect(() => {
        setRuntimeEnv(env);
    }, [env]);

    // Fetch meta/env if not provided by parent
    useEffect(() => {
        if (env) return; // already provided by parent
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch("/planner/api/meta", { cache: "no-store" });
                if (!res.ok) return;
                const json = (await res.json()) as Meta;

                const nextEnv = normalizeEnv(json?.env);
                if (!cancelled && nextEnv) setRuntimeEnv(nextEnv);

                if (!cancelled) setMeta(json);
            } catch {
                // ignore
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [env]);

    useEffect(() => {
        setIsDark(getIsDark());
    }, []);

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

    const updateTooltipClamp = () => {
        const badge = badgeRef.current;
        const tip = tipRef.current;
        if (!badge || !tip) return;

        // reset first (measure natural centered position)
        setTipShift(0);

        requestAnimationFrame(() => {
            const t = tipRef.current;
            if (!t) return;

            const rect = t.getBoundingClientRect();
            const padding = 8;
            let shift = 0;

            if (rect.left < padding) shift = padding - rect.left;
            if (rect.right > window.innerWidth - padding) shift = (window.innerWidth - padding) - rect.right;

            setTipShift(shift);
        });
    };

    useEffect(() => {
        const onResize = () => updateTooltipClamp();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleTheme = () => {
        const next = isDark ? "light" : "dark";
        setTheme(next);
        setIsDark(next === "dark");
    };

    const envToShow = runtimeEnv;

    return (
        <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="relative flex h-16 w-full items-center px-4">
                <div className="flex flex-1 basis-0 items-center gap-3 min-w-0">
                    <div className="relative h-9 w-9 object-contain drop-shadow-sm">
                        <div className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md ring-1 ring-white/10 overflow-hidden">
                            <div className="pointer-events-none absolute -inset-2 rounded-2xl bg-indigo-500/20 blur-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                            <div className="pointer-events-none absolute top-0 left-0 h-1/3 w-full bg-gradient-to-b from-white/20 to-transparent" />

                            <img src="/logo.png" alt="Clinic Planner Logo" className="relative h-8 w-8 object-contain" />
                        </div>
                    </div>

                    <div className="flex flex-col leading-tight min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                Clinic Planner
                            </div>

                            {envToShow && (
                                <div className="tooltip relative">
                                    <span
                                        ref={badgeRef}
                                        onMouseEnter={updateTooltipClamp}
                                        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide border ${
                                            envToShow === "PROD"
                                                ? "bg-red-50 text-red-700 border-red-200 env-glow-prod dark:bg-red-950/40 dark:text-red-200 dark:border-red-900/60"
                                                : envToShow === "QA"
                                                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/35 dark:text-amber-200 dark:border-amber-900/60"
                                                    : envToShow === "STAGE"
                                                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/35 dark:text-indigo-200 dark:border-indigo-900/60"
                                                        : "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                                        }`}
                                    >
                                        {envToShow === "QA" && (
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-600" />
                                        )}
                                        {envToShow === "PROD" && (
                                            <span className="inline-flex h-2 w-2 rounded-full bg-red-600" />
                                        )}
                                        {envToShow}
                                    </span>

                                    <div
                                        ref={tipRef}
                                        className="tooltip-content left-1/2 -translate-x-1/2"
                                        style={{
                                            transform: `translateX(calc(-50% + ${tipShift}px))`,
                                        }}
                                    >
                                        <div className="font-semibold text-slate-800 dark:text-slate-100">
                                            Environment: {envToShow}
                                        </div>

                                        <div className="mt-1 text-slate-600 dark:text-slate-300">
                                            {envToShow === "PROD"
                                                ? "Live system. Changes affect real schedules."
                                                : envToShow === "QA"
                                                    ? "Testing environment. Data may reset."
                                                    : envToShow === "STAGE"
                                                        ? "Pre-production. Validate before going live."
                                                        : "Development environment. Safe for experiments."}
                                        </div>

                                        {meta && (
                                            <div className="mt-3 space-y-1 text-[11px] border-t border-slate-200 dark:border-slate-700 pt-2">
                                                {meta.version && (
                                                    <div className="flex justify-between gap-4">
                                                        <span className="text-slate-500 dark:text-slate-400">Version</span>
                                                        <span className="font-medium text-slate-700 dark:text-slate-200">
                                                            {meta.version}
                                                        </span>
                                                    </div>
                                                )}

                                                {meta.commit && (
                                                    <div className="flex justify-between gap-4">
                                                        <span className="text-slate-500 dark:text-slate-400">Commit</span>
                                                        <span className="font-mono text-slate-700 dark:text-slate-200">
                                                            {meta.commit}
                                                        </span>
                                                    </div>
                                                )}

                                                {meta.region && (
                                                    <div className="flex justify-between gap-4">
                                                        <span className="text-slate-500 dark:text-slate-400">Region</span>
                                                        <span className="text-slate-700 dark:text-slate-200">
                                                            {meta.region}
                                                        </span>
                                                    </div>
                                                )}

                                                {meta.buildTime && (
                                                    <div className="flex justify-between gap-4">
                                                        <span className="text-slate-500 dark:text-slate-400">Build</span>
                                                        <span className="text-slate-700 dark:text-slate-200">
                                                            {new Date(meta.buildTime).toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            {syncState === "syncing"
                                ? "Syncing…"
                                : syncState === "synced"
                                    ? `Last synced ${formatLastSynced(lastSyncedAt)}`
                                    : syncState === "error"
                                        ? "Sync failed"
                                        : ""}
                        </div>
                    </div>
                </div>

                {/* CENTER — Month Navigation (true centered on screen) */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
                    <button
                        onClick={onPrevMonth}
                        className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        aria-label="Previous month"
                    >
                        ‹
                    </button>

                    <div className="flex h-9 items-center overflow-hidden rounded-lg border border-slate-200 bg-white px-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <span
                            key={formatMonthTitle(anchorMonth)}
                            className="animate-fadeInUp text-sm font-semibold text-slate-800 dark:text-slate-100"
                        >
                            {formatMonthTitle(anchorMonth)}
                        </span>
                    </div>

                    <button
                        onClick={onNextMonth}
                        className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        aria-label="Next month"
                    >
                        ›
                    </button>

                    <button
                        onClick={onCurrentMonth}
                        disabled={isCurrentMonth}
                        className={`ml-2 h-9 rounded-lg px-4 text-sm font-medium shadow-sm transition ${
                            isCurrentMonth
                                ? "cursor-default border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                        Current Month
                    </button>
                </div>

                {/* RIGHT — force this column to take space and align to the far right */}
                <div className="flex flex-1 basis-0 items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                        aria-label="Toggle theme"
                    >
                        <span className="text-base leading-none">{isDark ? "☀" : "🌙"}</span>
                    </button>

                    <Link
                        href="/planner/clinicians"
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        Clinician Management
                    </Link>

                    <button
                        type="button"
                        onClick={() => setHolidayOpen(true)}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        title="Add/remove a holiday"
                    >
                        Add Holiday
                    </button>

                    <div className="relative" ref={menuRef}>
                        <button
                            disabled
                            onClick={() => setMenuOpen((v) => !v)}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                                CE
                            </div>
                            <span className="hidden sm:block">Cane</span>
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
                                <Link
                                    href="/settings"
                                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Settings
                                </Link>
                                <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
                                    Account
                                </button>
                                <div className="border-t border-slate-200 dark:border-slate-800" />
                                <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50 dark:hover:bg-slate-800">
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AddHolidayModal
                open={holidayOpen}
                onClose={() => setHolidayOpen(false)}
                clinicians={clinicians}
                onRefresh={onRefresh}
            />
        </header>
    );
}