type AlertsDrawerHeaderProps = {
    totalAlerts: number;
    onClose: () => void;
};

export default function AlertsDrawerHeader({
                                               totalAlerts,
                                               onClose,
                                           }: AlertsDrawerHeaderProps) {
    return (
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
                <h2 className="text-xl font-semibold text-slate-950">
                    Alerts
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Review planner issues at a glance.
                </p>
            </div>

            <div className="flex items-center gap-3">
                <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                    {totalAlerts}
                </span>

                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Close alerts drawer"
                >
                    ×
                </button>
            </div>
        </header>
    );
}