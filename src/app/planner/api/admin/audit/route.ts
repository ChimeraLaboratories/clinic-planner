import {db} from "@/lib/db";
import {NextResponse} from "next/server";

export async function GET() {
    try {
        const [rows] = await db.query(`
        SELECT
        id,
        created_at,
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
        FROM audit_log
        ORDER BY created_at DESC
        LIMIT 100
        `);

        return NextResponse.json(rows);
    } catch (error) {
        console.log("Failed to load audit logs", error);

        return NextResponse.json(
            { error: "Failed to load audit logs" },
            { status: 500 }
        );
    }
}