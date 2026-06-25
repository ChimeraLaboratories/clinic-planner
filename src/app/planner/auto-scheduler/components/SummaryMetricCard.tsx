const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-600",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
};

export function SummaryMetricCard({
    label,
    value,
    suffix,
    tone,
    }: {
    label: string;
    value: string | number;
    suffix?: string;
    tone: keyof typeof tones;
}) {
    return (
        <div className={`rounded-lg border p-4 text-center ${tones[tone]}`}>
            <div className="text-sm font-medium">{label}</div>
            <div className="mt-2 text-3xl font-bold text-slate-950">{value}</div>
            {suffix && <div className="mt-1 text-xs font-semibold">{suffix}</div>}
        </div>
    );
}