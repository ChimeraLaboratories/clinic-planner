type AlertsDrawerHeaderProps = {
    totalAlerts: number;
    onClose: () => void;
};

export default function AlertsDrawerHeader({
                                               totalAlerts,
                                               onClose,
                                           }: AlertsDrawerHeaderProps) {
    return (
        <header className="flex items-center justify-between px-6 py-6">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                    aria-label="Close alerts drawer"
                >
                    ×
                </button>

                <div>
                    <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                        Alerts
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-xl text-slate-900 dark:text-white">
                    ♡
                </span>

                <span className="rounded-lg bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                    {totalAlerts}
                </span>
            </div>
        </header>
    );
}