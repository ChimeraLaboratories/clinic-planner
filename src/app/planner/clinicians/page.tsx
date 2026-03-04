import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import CliniciansTableClient from "./CliniciansTableClient";

type Clinician = {
    id: number;
    full_name: string;
    display_name: string;
    role_code: number;
    grade_code: number;
    GOC_number: string | null;
    is_supervisor: number;
    is_active: number;
};

export default async function CliniciansPage() {
    const h = await headers();
    const host = h.get("host");
    if (!host) return notFound();
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

    const res = await fetch(`${protocol}://${host}/planner/api/clinicians?includeInactive=1`, {
        cache: "no-store",
    });

    if (!res.ok) return notFound();

    const clinicians: Clinician[] = await res.json();

    return (
        <div className="min-h-screen bg-slate-50 p-8 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        Clinician Management
                    </h1>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/planner"
                            className="text-sm px-3 py-2 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            ← Back to Planner
                        </Link>

                        <Link
                            href="/planner/clinicians/new"
                            className="rounded bg-slate-900 px-3 py-2 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                        >
                            + Add clinician
                        </Link>
                    </div>
                </div>

                <CliniciansTableClient clinicians={clinicians} />

                <div className="text-xs text-slate-500 dark:text-slate-400">
                    Tip: deactivate clinicians instead of deleting so historic sessions stay linked.
                </div>
            </div>
        </div>
    );
}