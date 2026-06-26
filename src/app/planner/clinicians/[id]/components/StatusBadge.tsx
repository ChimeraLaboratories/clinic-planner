type StatusBadgeProps = {
    label: string;
    tone?: "green" | "purple" | "blue" | "red" | "amber";
};

const toneClasses = {
    green: "bg-emerald-50 text-emerald-700",
    purple: "bg-violet-50 text-violet-700",
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
};

export default function StatusBadge({ label, tone = "blue" }: StatusBadgeProps) {
    return (
        <span
            className={`inline-flex h-8 items-center rounded-lg px-4 text-sm font-bold ${toneClasses[tone]}`}
        >
            {label}
        </span>
    );
}