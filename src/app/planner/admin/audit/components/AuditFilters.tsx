type AuditFiltersProps = {
    search: string;
    actionFilter: string;
    areaFilter: string;
    onSearchChange: (value: string) => void;
    onActionFilterChange: (value: string) => void;
    onAreaFilterChange: (value: string) => void;
};

export function AuditFilters({
                                 search,
                                 actionFilter,
                                 areaFilter,
                                 onSearchChange,
                                 onActionFilterChange,
                                 onAreaFilterChange,
                             }: AuditFiltersProps) {
    return (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex flex-wrap gap-3">
                <input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search user or summary..."
                    className="min-w-64 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />

                <select
                    value={actionFilter}
                    onChange={(e) => onActionFilterChange(e.target.value)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                >
                    <option value="all">All actions</option>
                    <option value="SESSION_CREATED">Created</option>
                    <option value="SESSION_UPDATED">Updated</option>
                    <option value="SESSION_DELETED">Deleted</option>
                </select>

                <select
                    value={areaFilter}
                    onChange={(e) => onAreaFilterChange(e.target.value)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                >
                    <option value="all">All areas</option>
                    <option value="session">Session</option>
                    <option value="rota">Rota</option>
                    <option value="holiday">Holiday</option>
                    <option value="clinician">Clinician</option>
                    <option value="room">Room</option>
                </select>
            </div>
        </div>
    );
}