export default function AlertsEmptyState() {
    return (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-2xl">
                    ✓
                </div>

                <h2 className="text-lg font-semibold text-slate-950">
                    No alerts found
                </h2>

                <p className="text-sm text-slate-600">
                    When Clinic Planner detects issues, they will appear here for review.
                </p>
            </div>
        </section>
    );
}