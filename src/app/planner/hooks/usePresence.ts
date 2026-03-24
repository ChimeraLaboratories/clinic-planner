"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type PresenceUser = {
    userId: number;
    name: string;
    role: string | null;
    currentPath: string | null;
    lastSeenAt: string;
    isOnline: boolean;
    jobRole?: string | null;
    dateYmd?: string | null;
    viewMode?: "month" | "day" | null;
};

function parsePlannerLocation(pathname: string | null | undefined): {
    dateYmd: string | null;
    viewMode: "month" | "day" | null;
} {
    const path = String(pathname ?? "").trim();

    if (!path) {
        return { dateYmd: null, viewMode: null };
    }

    const dayMatch = path.match(/^\/planner\/(\d{4}-\d{2}-\d{2})(?:\/)?$/);
    if (dayMatch) {
        return {
            dateYmd: dayMatch[1],
            viewMode: "day",
        };
    }

    if (path === "/planner" || path.startsWith("/planner?")) {
        return {
            dateYmd: null,
            viewMode: "month",
        };
    }

    return {
        dateYmd: null,
        viewMode: null,
    };
}

export function usePresence() {
    const pathname = usePathname();
    const [users, setUsers] = useState<PresenceUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function sendHeartbeat() {
            try {
                await fetch("/planner/api/presence/heartbeat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        currentPath: pathname ?? "/planner",
                    }),
                    cache: "no-store",
                });
            } catch (error) {
                console.error("Presence heartbeat failed", error);
            }
        }

        async function loadPresence() {
            try {
                const res = await fetch("/planner/api/presence", {
                    method: "GET",
                    cache: "no-store",
                });

                if (!res.ok) return;

                const data = await res.json();
                if (!cancelled) {
                    const nextUsers = Array.isArray(data?.users)
                        ? data.users.map((user: any) => {
                            const parsed = parsePlannerLocation(user?.currentPath);
                            return {
                                ...user,
                                dateYmd: parsed.dateYmd,
                                viewMode: parsed.viewMode,
                            };
                        })
                        : [];

                    setUsers(nextUsers);
                }
            } catch (error) {
                console.error("Presence fetch failed", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        sendHeartbeat();
        loadPresence();

        const heartbeatInterval = window.setInterval(sendHeartbeat, 30000);
        const refreshInterval = window.setInterval(loadPresence, 15000);

        function onVisible() {
            if (document.visibilityState === "visible") {
                sendHeartbeat();
                loadPresence();
            }
        }

        document.addEventListener("visibilitychange", onVisible);

        return () => {
            cancelled = true;
            window.clearInterval(heartbeatInterval);
            window.clearInterval(refreshInterval);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [pathname]);

    return { users, loading };
}