"use client";

import { useEffect, useState } from "react";

export default function Page() {
    const [data, setData] = useState<any>(null);

    async function load() {
        const today = new Date();
        const from = today.toISOString().split("T")[0];

        const toDate = new Date(today);
        toDate.setDate(today.getDate() + 6);
        const to = toDate.toISOString().split("T")[0];

        const res = await fetch(`/api/planner?from=${from}&to=${to}`, {
            cache: "no-store",
        });

        const json = await res.json();
        console.log("API Response:", json);
        setData(json);
    }

    useEffect(() => {
        load();
        const interval = setInterval(load, 10000);
        return () => clearInterval(interval);
    }, []);

    if (!data) return <div>Loading…</div>;

    return (
        <div style={{ padding: 20 }}>
            <h1>Clinic Planner</h1>

            <h2>Rooms</h2>
            <pre>{JSON.stringify(data.rooms, null, 2)}</pre>

            <h2>Clinicians</h2>
            <pre>{JSON.stringify(data.clinicians, null, 2)}</pre>

            <h2>Sessions</h2>
            <pre>{JSON.stringify(data.sessions, null, 2)}</pre>
        </div>
    );
}