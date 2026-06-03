export function JsonBlock({ title, value }: { title: string; value: unknown }) {
    return (
        <div>
            <div className="mb-1 font-medium text-slate-700 dark:text-slate-300">
                {title}
            </div>

            <pre className="max-h-64 overflow-auto rounded-xl bg-slate-100 dark:bg-slate-900 p-3 text-xs text-slate-800 dark:text-slate-200">
        {value ? JSON.stringify(value, null, 2) : "-"}
      </pre>
        </div>
    );
}