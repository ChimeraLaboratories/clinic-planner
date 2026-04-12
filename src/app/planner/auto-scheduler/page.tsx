import Link from "next/link";
import AutoSchedulerClient from "./AutoSchedulerClient";

export default function AutoSchedulerPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900">Clinic Planner</h1>
                        <p className="text-sm text-slate-500">Automatic Clinic Scheduling</p>
                    </div>

                    <Link
                        href="/planner"
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Back to Planner
                    </Link>
                </div>
            </div>

            <AutoSchedulerClient />
        </div>
    );
}