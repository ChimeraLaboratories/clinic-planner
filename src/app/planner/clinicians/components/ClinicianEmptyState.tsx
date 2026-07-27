export default function ClinicianEmptyState() {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-950">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl dark:bg-blue-950/40">
                👥
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-950 dark:text-white">
                No clinicians found
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Try changing the filters or search term.
            </p>
        </div>
    );
}