/**
 * Represents a single audit event recorded by Clinic Planner.
 */
export type AuditLog = {
    id: number;
    created_at: string;
    actor_name: string | null;
    actor_email: string | null;
    action: string;
    entity_type: string;
    target_date: string | null;
    summary: string | null;
    before_json?: unknown;
    after_json?: unknown;
    meta_json?: unknown;
    ip_address?: string | null;
    user_agent?: string | null;
};