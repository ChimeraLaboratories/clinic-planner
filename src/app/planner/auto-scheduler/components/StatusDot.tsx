import {AllocationStatus} from "@/app/planner/auto-scheduler/types";
import {AlertTriangle, Check, Minus} from "lucide-react";

export function StatusDot({ status }: { status: AllocationStatus }) {
    if (status === "allocated") {
        return (
            <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white">
                <Check size={11} strokeWidth={3}/>
            </span>
        );
    }

    if (status === "issue") {
        return (
            <AlertTriangle size={16} className="text-amber-500" fill="currentColor"/>
        );
    }

    return (
        <span className="grid h-4 w-4 place-items-center rounded-full bg-slate-300 text-white">
            <Minus size={11} strokeWidth={3}/>
        </span>
    );
}