"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePresence } from "@/app/planner/hooks/usePresence";

function initialsFromName(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatLastSeen(value: string) {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "Offline";

    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;

    return "Offline";
}

export default function UserPresencePill() {
    const { users, loading } = usePresence();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

    const onlineUsers = useMemo(
        () => users.filter((u) => u.isOnline),
        [users]
    );

    const previewUsers = onlineUsers.slice(0, 3);

    useEffect(() => {
        function onPointerDown(event: MouseEvent) {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false);
        }

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, []);

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                aria-haspopup="dialog"
                aria-expanded={open}
            >
                <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>

                <span>
                    {loading ? "Presence..." : `${onlineUsers.length} online`}
                </span>

                <div className="ml-1 flex -space-x-2">
                    {previewUsers.map((user) => (
                        <div
                            key={user.userId}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-slate-100 text-[10px] font-semibold text-slate-700 dark:border-slate-900 dark:bg-slate-700 dark:text-slate-100"
                            title={user.name}
                        >
                            {initialsFromName(user.name)}
                        </div>
                    ))}
                </div>
            </button>

            {open ? (
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Team Presence
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {onlineUsers.length} online now
                            </p>
                        </div>
                    </div>

                    <div className="max-h-80 space-y-2 overflow-y-auto">
                        {users.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                No presence data yet.
                            </div>
                        ) : (
                            users.map((user) => (
                                <div
                                    key={user.userId}
                                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40"
                                >
                                    <div className="min-w-0 flex items-center gap-3">
                                        <div className="relative">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                                                {initialsFromName(user.name)}
                                            </div>
                                            <span
                                                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${
                                                    user.isOnline ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                                                }`}
                                            />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                                {user.name}
                                            </p>
                                            <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                {user.jobRole || user.role || "User"}
                                                {user.currentPath ? ` • ${user.currentPath}` : ""}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-3 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                                        {user.isOnline ? "Online" : formatLastSeen(user.lastSeenAt)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}