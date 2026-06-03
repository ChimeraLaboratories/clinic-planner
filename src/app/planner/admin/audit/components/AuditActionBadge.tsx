
export function formatAction(action: string) {
    return action
        .replace("SESSION_", "")
        .replaceAll("_"," ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getActionBadgeClass(action: string) {
    if (action.includes("CREATED")) {
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    }
    if (action.includes("UPDATED")) {
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    }

    if (action.includes("DELETED")) {
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    }
    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
}

export function AuditActionBadge({ action }: { action: string }) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getActionBadgeClass(
                action
            )}`}
        >
      {formatAction(action)}
    </span>
    );
}