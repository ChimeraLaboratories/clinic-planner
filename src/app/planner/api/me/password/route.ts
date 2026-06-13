import {NextRequest, NextResponse} from "next/server";
import {getCurrentUserFromCookies, hashPassword, verifyPassword} from "@/lib/auth";
import {db} from "@/lib/db";

export async function PUT(req: NextRequest) {
    const user = await getCurrentUserFromCookies();

    if (!user) {
        return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body = await req.json();
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");

    if (!currentPassword || !newPassword || !confirmPassword) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (newPassword.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: "New passwords do not match" }, { status: 400 });
    }

    const [rows] = await db.query(
        `
        SELECT password_hash
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [user.id]
    );

    const dbUser = Array.isArray(rows) ? (rows[0] as { password_hash: string }) : null;

    if (!dbUser?.password_hash) {
        return NextResponse.json({ error: "User password could not be found" }, { status: 400 });
    }

    const isCurrentPasswordValid = await verifyPassword(currentPassword, dbUser.password_hash);

    if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const newPasswordHash = await hashPassword(newPassword);

    await db.query(
        `
        UPDATE users
        SET password_hash = ?
        WHERE id = ?
        `,
        [newPasswordHash, user.id]
    );

    return NextResponse.json({ ok: true });
}