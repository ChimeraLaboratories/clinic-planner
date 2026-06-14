export default function AlertsHeader() {
    return (
        <div className="flex flex-col gap-1">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                Operational Alerts & Monitoring
            </p>

            <h1 className="text-2xl font-semibold text-slate-950">
                Alerts Centre
            </h1>

            <p className="max-w-2xl text-sm text-slate-600">
                Review planner issues such as missing clinicians, room conflicts,
                empty clinics and training reminders.
            </p>
        </div>
    );
}