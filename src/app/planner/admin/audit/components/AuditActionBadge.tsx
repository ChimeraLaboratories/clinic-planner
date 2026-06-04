/**
 * AuditActionBadge.tsx
 *
 * Shared audit log UI helpers.
 *
 * Responsibilities:
 * - Convert raw audit action codes into user-friendly labels.
 * - Apply consistent colour coding to audit actions.
 * - Display audit actions as styled badges throughout the application.
 */

/**
 * Converts a database audit action into a readable label.
 *
 * Examples:
 * SESSION_CREATED -> "Created"
 * SESSION_UPDATED -> "Updated"
 * USER_ACCOUNT_CREATED -> "User Account Created"
 */
export function formatAction(action: string) {
    return action
        .replace("SESSION_", "")
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Returns the colour scheme associated with an audit action.
 *
 * Business Rules:
 * - Created actions are displayed in green.
 * - Updated actions are displayed in amber.
 * - Deleted actions are displayed in red.
 * - Unknown actions fall back to a neutral style.
 */
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

/**
 * Displays a colour-coded audit action badge.
 *
 * Used throughout the audit area to provide a quick visual
 * indication of the type of change that occurred.
 */
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