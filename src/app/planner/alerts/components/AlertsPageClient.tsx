"use client";

import AlertsHeader from "./AlertsHeader";
import AlertsEmptyState from "./AlertsEmptyState";

export default function AlertsPageClient() {
    return (
        <main className="min-h-screen bg-slate-50 px-6 py-6">
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
                <AlertsHeader />

                <AlertsEmptyState />
            </div>
        </main>
    );
}