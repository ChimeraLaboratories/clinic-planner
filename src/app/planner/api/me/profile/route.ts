import {getCurrentUserFromCookies} from "@/lib/auth";
import {NextResponse} from "next/server";
import {db} from "@/lib/db";

export async function GET() {
    const user = await getCurrentUserFromCookies();

    if (!user) return NextResponse.json( {error: "No User Selected" }, { status : 401 });

    const [rows] = await db.query(
        `
        SELECT
        id,
        email,
        full_name,
        role,
        job_role,
        is_active,
        profile_image_url
        FROM users
        WHERE id = ?
        LIMIT 1`, [user.id]
    );

    const users = rows as any[];

    if (users.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404});

    return NextResponse.json(users);
}

export async function PUT(req: Request) {
    const user = await getCurrentUserFromCookies();

    if (!user) return NextResponse.json( {error: "No User Selected" }, { status : 401 });

    const body = await req.json();

    const full_name = String(body.full_name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const job_role = String(body.job_role ?? "").trim();

    if (!full_name) return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "Email address is required" }, { status: 400 });

    await db.query(
        `
        UPDATE users
        SET
        full_name = ?,
        email = ?,
        job_role = ?
        WHERE id = ?
        `, [full_name, email, job_role || null, user.id]
    );

    return NextResponse.json({
        id: user.id,
        full_name,
        email,
        job_role,
        role: user.role,
    });
}