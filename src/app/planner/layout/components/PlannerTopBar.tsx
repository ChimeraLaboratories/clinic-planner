"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import AddHolidayModal from "../../modals/components/AddHolidayModal";
import MonthSwitcher from "@/app/planner/calendar/components/MonthSwitcher";

import { formatUserTime } from "@/app/planner/utils/userFormat";
import { getUserInitials } from "@/app/planner/utils/userInitials";

import { useUserPreferences } from "@/app/planner/hooks/useUserPreferences";
import { usePlannerUser } from "@/app/planner/context/UserContext";
import { useMonthNavigation } from "@/app/planner/context/MonthNavigationContext";
import { useDayNavigation } from "@/app/planner/context/DayNavigationContext";

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

type CurrentUser = {
    id: number;
    email: string;
    full_name?: string | null;
    role: "ADMIN" | "PLANNER" | "VIEWER";
    job_role?: string | null;
};

function normalizeEnv(v: unknown): Env | undefined {
    const s = String(v ?? "").trim().toUpperCase();

    if (s === "DEV" || s === "QA" || s === "STAGE" || s === "PROD") {
        return s as Env;
    }

    return undefined;
}

function getIsDark() {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
}

function setTheme(next: "light" | "dark") {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    if (next === "dark") {
        root.classList.add("dark");
    } else {
        root.classList.remove("dark");
    }

    try {
        localStorage.setItem("theme", next);
    } catch {}
}

function formatLastSynced(d: Date | null | undefined, timeFormat: string) {
    if (!d) return "";
    return formatUserTime(d, timeFormat);
}

function SyncBadge({
                       syncState,
                       lastSyncedAt,
                   }: {
    syncState?: "idle" | "syncing" | "synced" | "error";
    lastSyncedAt?: Date | null;
}) {
    const state = syncState ?? (lastSyncedAt ? "synced" : "idle");

    const isSyncing = state === "syncing";
    const isError = state === "error";
    const { preferences } = useUserPreferences();

    const label = isSyncing ? "Syncing…" : isError ? "Sync failed" : "Synced";
    const time =
        !isSyncing && !isError
            ? formatLastSynced(lastSyncedAt ?? null, preferences.time_format)
            : "";

    return (
        <div
            className={[
                "inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                isSyncing
                    ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/35 dark:text-blue-200"
                    : isError
                        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-200",
            ].join(" ")}
            aria-label="Sync status"
            title={
                isSyncing
                    ? "Syncing…"
                    : isError
                        ? "Sync failed"
                        : time
                            ? `Last synced ${time}`
                            : "Synced"
            }
        >
            <span
                className={[
                    "inline-flex h-2 w-2 rounded-full",
                    isSyncing
                        ? "animate-pulse bg-blue-600"
                        : isError
                            ? "bg-red-600"
                            : "bg-emerald-600",
                ].join(" ")}
            />

            <span>{label}</span>

            {time ? <span className="font-medium opacity-80">• {time}</span> : null}
        </div>
    );
}

export default function PlannerTopBar({
                                          env,
                                          syncState,
                                          lastSyncedAt,
                                          clinicians,
                                          onRefresh,
                                      }: {
    env?: Env;
    syncState?: "idle" | "syncing" | "synced" | "error";
    lastSyncedAt?: Date | null;
    clinicians?: ClinicianLite[];
    onRefresh?: () => void | Promise<void>;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const [holidayOpen, setHolidayOpen] = useState(false);

    const [isDark, setIsDark] = useState(false);

    const [runtimeEnv, setRuntimeEnv] = useState<Env | undefined>(env);
    const [meta, setMeta] = useState<Meta | null>(null);

    const badgeRef = useRef<HTMLSpanElement | null>(null);
    const tipRef = useRef<HTMLDivElement | null>(null);
    const [tipShift, setTipShift] = useState(0);

    const [, setCurrentUser] = useState<CurrentUser | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);
    const { user, setUser } = usePlannerUser();

    const [adminOpen, setAdminOpen] = useState(false);
    const adminRef = useRef<HTMLDivElement | null>(null);

    const {
        anchorMonth,
        showMonthSwitcher,
        onPrevMonth,
        onNextMonth,
        onCurrentMonth,
    } = useMonthNavigation();

    const {
        selectedDate,
        showDaySwitcher,
        onPrevDay,
        onNextDay,
        onToday,
    } = useDayNavigation();

    const shouldShowMonthSwitcher =
        showMonthSwitcher &&
        anchorMonth &&
        onPrevMonth &&
        onNextMonth &&
        onCurrentMonth &&
        !showDaySwitcher;

    const shouldShowDaySwitcher =
        showDaySwitcher &&
        selectedDate &&
        onPrevDay &&
        onNextDay &&
        onToday;

    useEffect(() => {
        setRuntimeEnv(env);
    }, [env]);

    useEffect(() => {
        let cancelled = false;

        async function loadCurrentUser() {
            try {
                const res = await fetch("/planner/api/me", { cache: "no-store" });

                if (!res.ok) {
                    if (!cancelled) setCurrentUser(null);
                    return;
                }

                const json = await res.json();

                if (!cancelled) {
                    const loadedUser = json?.user ?? null;
                    setCurrentUser(loadedUser);
                    setUser(loadedUser);
                }
            } catch {
                if (!cancelled) setCurrentUser(null);
            }
        }

        loadCurrentUser();

        return () => {
            cancelled = true;
        };
    }, [setUser]);

    useEffect(() => {
        if (env) return;

        let cancelled = false;

        async function loadMeta() {
            try {
                const res = await fetch("/planner/api/meta", { cache: "no-store" });
                if (!res.ok) return;

                const json = (await res.json()) as Meta;
                const nextEnv = normalizeEnv(json?.env);

                if (!cancelled && nextEnv) setRuntimeEnv(nextEnv);
                if (!cancelled) setMeta(json);
            } catch {}
        }

        loadMeta();

        return () => {
            cancelled = true;
        };
    }, [env]);

    useEffect(() => {
        setIsDark(getIsDark());
    }, []);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node;

            if (menuRef.current && !menuRef.current.contains(target)) {
                setMenuOpen(false);
            }

            if (adminRef.current && !adminRef.current.contains(target)) {
                setAdminOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const updateTooltipClamp = () => {
        const badge = badgeRef.current;
        const tip = tipRef.current;

        if (!badge || !tip) return;

        setTipShift(0);

        requestAnimationFrame(() => {
            const t = tipRef.current;
            if (!t) return;

            const rect = t.getBoundingClientRect();
            const padding = 8;
            let shift = 0;

            if (rect.left < padding) shift = padding - rect.left;
            if (rect.right > window.innerWidth - padding) {
                shift = window.innerWidth - padding - rect.right;
            }

            setTipShift(shift);
        });
    };

    useEffect(() => {
        const onResize = () => updateTooltipClamp();

        window.addEventListener("resize", onResize);

        return () => window.removeEventListener("resize", onResize);
    }, []);

    async function handleLogout() {
        try {
            setLoggingOut(true);
            await fetch("/planner/api/logout", { method: "POST" });
            window.location.href = "/login";
        } finally {
            setLoggingOut(false);
        }
    }

    function toggleTheme() {
        const next = isDark ? "light" : "dark";

        setTheme(next);
        setIsDark(next === "dark");
    }

    const envToShow = runtimeEnv;

    return (
        <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="relative flex h-16 w-full items-center px-4">
                <div className="flex min-w-0 flex-1 basis-0 items-center gap-3">
                    <div className="relative h-9 w-9 object-contain drop-shadow-sm">
                        <div className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md ring-1 ring-white/10">
                            <div className="pointer-events-none absolute -inset-2 rounded-2xl bg-indigo-500/20 opacity-0 blur-xl transition-opacity duration-200 group-hover:opacity-100" />
                            <div className="pointer-events-none absolute left-0 top-0 h-1/3 w-full bg-gradient-to-b from-white/20 to-transparent" />

                            <img
                                src="/logo.png"
                                alt="Clinic Planner Logo"
                                className="relative h-8 w-8 object-contain"
                            />
                        </div>
                    </div>

                    <div className="flex min-w-0 flex-col leading-tight">
                        <div className="flex min-w-0 items-center gap-2">
                            <div className="truncate font-semibold text-slate-900 dark:text-slate-100">
                                Clinic Planner
                            </div>

                            {/* <SyncBadge syncState={syncState} lastSyncedAt={lastSyncedAt} /> */}

                            {envToShow && (
                                <div className="tooltip relative">
                                    <span
                                        ref={badgeRef}
                                        onMouseEnter={updateTooltipClamp}
                                        className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
                                            envToShow === "PROD"
                                                ? "env-glow-prod border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
                                                : envToShow === "QA"
                                                    ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-200"
                                                    : envToShow === "STAGE"
                                                        ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/35 dark:text-indigo-200"
                                                        : "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
                                            <div className="mt-3 space-y-1 border-t border-slate-200 pt-2 text-[11px] dark:border-slate-700">
                                                {meta.version && (
                                                    <div className="flex justify-between gap-4">
                                                        <span className="text-slate-500 dark:text-slate-400">
                                                            Version
                                                        </span>
                                                        <span className="font-medium text-slate-700 dark:text-slate-200">
                                                            {meta.version}
                                                        </span>
                                                    </div>
                                                )}

                                                {meta.commit && (
                                                    <div className="flex justify-between gap-4">
                                                        <span className="text-slate-500 dark:text-slate-400">
                                                            Commit
                                                        </span>
                                                        <span className="font-mono text-slate-700 dark:text-slate-200">
                                                            {meta.commit}
                                                        </span>
                                                    </div>
                                                )}

                                                {meta.region && (
                                                    <div className="flex justify-between gap-4">
                                                        <span className="text-slate-500 dark:text-slate-400">
                                                            Region
                                                        </span>
                                                        <span className="text-slate-700 dark:text-slate-200">
                                                            {meta.region}
                                                        </span>
                                                    </div>
                                                )}

                                                {meta.buildTime && (
                                                    <div className="flex justify-between gap-4">
                                                        <span className="text-slate-500 dark:text-slate-400">
                                                            Build
                                                        </span>
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
                    </div>
                </div>

                {shouldShowMonthSwitcher && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <MonthSwitcher
                            anchorMonth={anchorMonth}
                            onPrevMonth={onPrevMonth}
                            onNextMonth={onNextMonth}
                            onCurrentMonth={onCurrentMonth}
                        />
                    </div>
                )}

                {shouldShowDaySwitcher && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onPrevDay}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                aria-label="Previous day"
                                title="Previous day"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                className="inline-flex h-9 min-w-52 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                            >
                                {selectedDate.toLocaleDateString("en-GB", {
                                    weekday: "short",
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </button>

                            <button
                                type="button"
                                onClick={onNextDay}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                aria-label="Next day"
                                title="Next day"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                onClick={onToday}
                                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Today
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex flex-1 basis-0 items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                        aria-label="Toggle theme"
                    >
                        <span className="text-base leading-none">
                            {isDark ? "☀" : "🌙"}
                        </span>
                    </button>

                    {user?.role === "ADMIN" && (
                        <div className="relative" ref={adminRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setAdminOpen((v) => !v);
                                    setMenuOpen(false);
                                }}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                aria-haspopup="menu"
                                aria-expanded={adminOpen}
                            >
                                <span>Admin</span>
                                <span
                                    className={`text-xs transition-transform ${
                                        adminOpen ? "rotate-180" : ""
                                    }`}
                                >
                                    ▼
                                </span>
                            </button>

                            {adminOpen && (
                                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Maintenance
                                    </div>

                                    <Link
                                        href="/planner/admin/users"
                                        className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                        onClick={() => setAdminOpen(false)}
                                    >
                                        User Management
                                    </Link>

                                    <Link
                                        href="/planner/clinicians"
                                        className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                        onClick={() => setAdminOpen(false)}
                                    >
                                        Clinician Management
                                    </Link>

                                    <Link
                                        href="/planner/room-assignment"
                                        className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                        onClick={() => setAdminOpen(false)}
                                    >
                                        Room Assignment
                                    </Link>

                                    <Link
                                        href="/planner/auto-scheduler"
                                        className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                        onClick={() => setAdminOpen(false)}
                                    >
                                        Auto Scheduler
                                    </Link>

                                    <Link
                                        href="/planner/admin/audit"
                                        className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                        onClick={() => setAdminOpen(false)}
                                    >
                                        Audit Logs
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

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
                            type="button"
                            onClick={() => {
                                setMenuOpen((v) => !v);
                                setAdminOpen(false);
                            }}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-xs font-semibold text-white">
                                {user?.profile_image_url ? (
                                    <img
                                        src={user.profile_image_url}
                                        alt="Profile"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    getUserInitials(user?.full_name, user?.email)
                                )}
                            </span>

                            <span className="text-left leading-tight">
                                <span className="block">
                                    {user?.full_name || user?.email || "User"}
                                </span>
                                <span className="block text-xs text-slate-500 dark:text-slate-400">
                                    {[user?.job_role, user?.role].filter(Boolean).join(" · ")}
                                </span>
                            </span>
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                                <div className="rounded-lg px-3 py-2">
                                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        {user?.full_name || "Signed in"}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {user?.email || ""}
                                    </div>
                                </div>

                                <div className="my-2 h-px bg-slate-200 dark:bg-slate-800" />

                                <Link
                                    href="/planner/settings"
                                    onClick={() => setMenuOpen(false)}
                                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Settings
                                </Link>

                                <Link
                                    href="/planner/settings/security"
                                    onClick={() => setMenuOpen(false)}
                                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Change Password
                                </Link>

                                <div className="my-2 h-px bg-slate-200 dark:bg-slate-800" />

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    disabled={loggingOut}
                                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-slate-50 disabled:opacity-60 dark:hover:bg-slate-800"
                                >
                                    {loggingOut ? "Signing out..." : "Sign out"}
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