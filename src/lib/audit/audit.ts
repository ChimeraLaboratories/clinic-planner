import { db } from "@/lib/db";

export type AuditInput = {
    actor?: {
        id?: number | null;
        email?: string | null;
        name?: string | null;
    };
    action: string;
    entityType: string;
    entityId?: string | number | null;
    targetDate?: string | null;
    summary?: string | null;
    before?: unknown;
    after?: unknown;
    meta?: unknown;
    ipAddress?: string | null;
    userAgent?: string | null;
};

export async function writeAuditLog(input: AuditInput) {
    await db.query(
        `
        INSERT INTO audit_log (
            actor_user_id,
            actor_email,
            actor_name,
            action,
            entity_type,
            entity_id,
            target_date,
            summary,
            before_json,
            after_json,
            meta_json,
            ip_address,
            user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            input.actor?.id ?? null,
            input.actor?.email ?? null,
            input.actor?.name ?? null,
            input.action,
            input.entityType,
            input.entityId != null ? String(input.entityId) : null,
            input.targetDate ?? null,
            input.summary ?? null,
            input.before != null ? JSON.stringify(input.before) : null,
            input.after != null ? JSON.stringify(input.after) : null,
            input.meta != null ? JSON.stringify(input.meta) : null,
            input.ipAddress ?? null,
            input.userAgent ?? null,
        ]
    );
}