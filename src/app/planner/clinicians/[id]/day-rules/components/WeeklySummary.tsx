import {CalendarDays, CircleDot, CircleX, Clipboard, Eye, PanelsTopLeft, Store} from "lucide-react";
import {ReactNode} from "react";

export function WeeklySummary({
                                  summary,
                              }: {
    summary: { st: number; cl: number; gf: number; off: number };
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
            <div className="grid grid-cols-5 items-center gap-4">
                <h2 className="text-xl font-bold">Weekly Summary</h2>
                <Item icon={<Eye/>} label={`${summary.st} ST Days`} colour="blue" />
                <Item icon={<CircleDot/>} label={`${summary.cl} CL Day`} colour="green" />
                <Item icon={<Store/>} label={`${summary.gf} Ground Floor Day`} colour="amber" />
                <Item icon={<CircleX/>} label={`${summary.off} Days Off`} colour="red" />
            </div>
        </div>
    );
}

function Item({
                  icon,
                  label,
                  colour,
              }: {
    icon: ReactNode;
    label: string;
    colour: "blue" | "green" | "amber" | "red";
}) {
    const styles = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
        red: "bg-red-50 text-red-600",
    };

    return (
        <div className="flex items-center gap-4">
      <span className={`grid h-11 w-11 place-items-center rounded-xl text-lg font-bold ${styles[colour]}`}>
        {icon}
      </span>
            <span className="text-base font-bold">{label}</span>
        </div>
    );
}