import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import CliniciansTableClient from "./CliniciansTableClient";
import type { Clinician } from "./types";

export default async function CliniciansPage() {
    const h = await headers();
    const host = h.get("host");
    const cookie = h.get("cookie") ?? "";

    if (!host) return notFound();

    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

    let clinicians: Clinician[] = [];

    try {
        const res = await fetch(`${protocol}://${host}/planner/api/clinicians?includeInactive=1`, {
            headers: { cookie },
            cache: "no-store",
        });

        if (!res.ok) throw new Error(`Clinicians API failed: ${res.status}`);

        clinicians = await res.json();
    } catch (err) {
        console.error("[CliniciansPage] failed to load clinicians", err);
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
                        Practice setup
                    </p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                        Clinician Management
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                        Manage clinicians, grades, supervision status and clinic access.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/planner"
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                        ← Back to Planner
                    </Link>

                    <Link
                        href="/planner/holidays/new"
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                        Add Holiday
                    </Link>

                    <Link
                        href="/planner/clinicians/new"
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                    >
                        + Add Clinician
                    </Link>
                </div>
            </div>

            <CliniciansTableClient clinicians={clinicians} />
        </div>
    );
}