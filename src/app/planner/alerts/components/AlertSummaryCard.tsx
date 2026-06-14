type AlertSummaryCardProps = {
    total: number;
    critical: number;
    warning: number;
    info: number;
};

export default function AlertSummaryCard({
    total,
    critical,
    warning,
    info,
    }: AlertSummaryCardProps) {
    return (
        <section className="rounded-2xl border border-red-200 bg-red-200 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                Alerts requiring attention
            </p>

            <div className="mt-3 flex items-center gap-3">
                <span className="text-4xl font-bold text-red-600">
                    {total}
                </span>

                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-red-600">
                    !
                </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl bg-white px-3 py-2">
                    <p className="font-semibold text-red-700">{critical}</p>
                    <p className="text-slate-500">Critical</p>
                </div>

                <div className="rounded-xl bg-white px-3 py-2">
                    <p className="font-semibold text-orange-600">{warning}</p>
                    <p className="text-slate-500">Warnings</p>
                </div>

                <div className="rounded-xl bg-white px-3 py-2">
                    <p className="font-semibold text-blue-600">{info}</p>
                    <p className="text-slate-500">Info</p>
                </div>
            </div>
        </section>
    )
}