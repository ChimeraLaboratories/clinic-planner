"use client";

import { useMemo } from "react";
import { usePresence } from "@/app/planner/hooks/usePresence";

function formatLastSeen(value: string) {
    const date = new Date(value.replace(" ", "T"));
    if (isNaN(date.getTime())) return "Unknown";

    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;

    const diffHours = Math.floor(diffSec / 3600);
    return `${diffHours}h ago`;
}

export default function UserPresenceIndicator() {
    const { users, loading } = usePresence();

    const onlineCount = useMemo(
        () => users.filter((u) => u.isOnline).length,
        [users]
    );

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Team Presence
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {loading ? "Loading..." : `${onlineCount} online`}
                    </p>
                </div>

                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                </span>
            </div>

            <div className="space-y-2">
                {users.length === 0 && !loading ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        No presence data yet.
                    </div>
                ) : null}

                {users.map((user) => (
                    <div
                        key={user.userId}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40"
                    >
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span
                                    className={`h-2.5 w-2.5 rounded-full ${
                                        user.isOnline ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                                    }`}
                                />
                                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {user.name}
                                </p>
                            </div>

                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                {user.role ? <span>{user.role}</span> : null}
                                {user.currentPath ? <span>• {user.currentPath}</span> : null}
                            </div>
                        </div>

                        <div className="ml-3 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                            {user.isOnline ? "Online" : formatLastSeen(user.lastSeenAt)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}