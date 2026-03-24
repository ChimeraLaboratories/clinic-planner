export type UserRole = "ADMIN" | "PLANNER" | "VIEWER";

export function canEditClinics(role: UserRole | null | undefined) {
    return role === "ADMIN" || role === "PLANNER";
}

export function canManageUsers(role: UserRole | null | undefined) {
    return role === "ADMIN";
}