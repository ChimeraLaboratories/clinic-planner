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
};

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
                    setUsers(Array.isArray(data?.users) ? data.users : []);
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