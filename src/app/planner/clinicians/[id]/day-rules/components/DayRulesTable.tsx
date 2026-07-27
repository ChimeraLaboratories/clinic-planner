import type { DayRuleRow } from "./types";

const days = [
    { weekday: 1, name: "Mon", date: "20/06" },
    { weekday: 2, name: "Tue", date: "21/06" },
    { weekday: 3, name: "Wed", date: "22/06" },
    { weekday: 4, name: "Thu", date: "23/06" },
    { weekday: 5, name: "Fri", date: "24/06" },
    { weekday: 6, name: "Sat", date: "25/06" },
    { weekday: 0, name: "Sun", date: "26/06" },
];

export function DayRulesTable({
                                  rows,
                                  loading,
                                  saving,
                                  onChange,
                              }: {
    rows: DayRuleRow[];
    loading: boolean;
    saving: boolean;
    onChange: (weekday: number, patch: Partial<DayRuleRow>) => void;
}) {
    if (loading) {
        return (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">
                Loading day rules...
            </div>
        );
    }

    const byDay = new Map(rows.map((r) => [r.weekday, r]));

    return (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full table-fixed border-collapse">
                <thead>
                <tr className="border-b border-slate-200 bg-white">
                    <th className="w-[210px] px-6 py-6 text-left text-sm font-bold">Rule</th>
                    {days.map((day) => (
                        <th key={day.weekday} className="border-l border-slate-200 px-4 py-5 text-center">
                            <div className="text-sm font-bold">{day.name}</div>
                            <div className="mt-1 text-sm font-semibold text-slate-500">{day.date}</div>
                        </th>
                    ))}
                </tr>
                </thead>

                <tbody>
                <tr className="border-b border-slate-200">
                    <RuleLabel title="Working Status" subtitle="Is the clinician working?" icon="♙" />
                    {days.map((day) => {
                        const row = byDay.get(day.weekday);
                        const off = row?.activity_code === "D/O";

                        return (
                            <td key={day.weekday} className="border-l border-slate-200 px-4 py-7 text-center">
                                <button
                                    disabled={saving}
                                    onClick={() =>
                                        onChange(day.weekday, {
                                            activity_code: off ? "TESTING" : "D/O",
                                        })
                                    }
                                    className={`rounded-lg px-4 py-3 text-sm font-bold ${
                                        off
                                            ? "bg-red-50 text-red-600"
                                            : "bg-emerald-50 text-emerald-700"
                                    }`}
                                >
                                    {off ? "✕ Day Off" : "✓ Working"}
                                </button>
                            </td>
                        );
                    })}
                </tr>

                <tr className="border-b border-slate-200">
                    <RuleLabel title="Activity" subtitle="What will they be doing?" icon="▣" />
                    {days.map((day) => {
                        const row = byDay.get(day.weekday);
                        const off = row?.activity_code === "D/O";

                        return (
                            <td key={day.weekday} className="border-l border-slate-200 px-4 py-7 text-center">
                                {off ? (
                                    <span className="font-bold text-slate-400">—</span>
                                ) : (
                                    <select
                                        disabled={saving}
                                        value={row?.activity_code ?? "UNSET"}
                                        onChange={(e) =>
                                            onChange(day.weekday, { activity_code: e.target.value })
                                        }
                                        className={`h-12 w-full rounded-lg border-0 text-center text-sm font-bold outline-none ${
                                            row?.activity_code === "GF_DAY"
                                                ? "bg-amber-50 text-amber-600"
                                                : "bg-blue-50 text-blue-600"
                                        }`}
                                    >
                                        <option value="TESTING">Testing</option>
                                        <option value="GF_DAY">Ground Floor</option>
                                        <option value="SF">Shop Floor</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="CL">CL Testing</option>
                                    </select>
                                )}
                            </td>
                        );
                    })}
                </tr>

                <tr>
                    <RuleLabel title="Clinic Type" subtitle="ST / CL?" icon="◷" />
                    {days.map((day) => {
                        const row = byDay.get(day.weekday);
                        const off = row?.activity_code === "D/O";

                        return (
                            <td key={day.weekday} className="border-l border-slate-200 px-4 py-7 text-center">
                                {off ? (
                                    <span className="font-bold text-slate-400">—</span>
                                ) : (
                                    <select
                                        disabled={saving}
                                        value={row?.activity_code === "CL" ? "CL" : "TESTING"}
                                        onChange={(e) =>
                                            onChange(day.weekday, { activity_code: e.target.value })
                                        }
                                        className={`h-12 w-full rounded-lg border-0 text-center text-sm font-bold outline-none ${
                                            row?.activity_code === "CL"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-blue-50 text-blue-600"
                                        }`}
                                    >
                                        <option value="TESTING">ST</option>
                                        <option value="CL">CL</option>
                                    </select>
                                )}
                            </td>
                        );
                    })}
                </tr>
                </tbody>
            </table>
        </div>
    );
}

function RuleLabel({
                       title,
                       subtitle,
                       icon,
                   }: {
    title: string;
    subtitle: string;
    icon: string;
}) {
    return (
        <th className="px-6 py-7 text-left align-middle">
            <div className="flex items-center gap-4">
                <span className="text-xl font-bold text-blue-600">{icon}</span>
                <div>
                    <div className="text-sm font-bold">{title}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</div>
                </div>
            </div>
        </th>
    );
}