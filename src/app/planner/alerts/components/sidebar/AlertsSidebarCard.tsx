type Props = {
    totalAlerts: number;
    onOpen: () => void;
};

export default function AlertsSidebarCard({
                                              totalAlerts,
                                              onOpen,
                                          }: Props) {
    return (
        <button
            onClick={onOpen}
            className="w-full rounded-2xl border border-blue-200 bg-blue-50 p-6 text-left transition hover:bg-blue-100"
        >
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Alerts
                    </div>

                    <div className="mt-3 text-4xl font-bold text-blue-700">
                        {totalAlerts}
                    </div>

                    <div className="mt-2 text-sm text-slate-700">
                        Open alerts requiring attention
                    </div>
                </div>

                <div className="rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold text-white">
                    View
                </div>
            </div>
        </button>
    );
}