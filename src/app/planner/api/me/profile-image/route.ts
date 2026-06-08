import {getCurrentUserFromCookies} from "@/lib/auth";
import {NextRequest, NextResponse} from "next/server";
import path from "node:path";
import {writeFile} from "fs/promises";
import { db } from "@/lib/db";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest)  {
    const user = await getCurrentUserFromCookies()

    if (!user) {
        return NextResponse.json({ error: "Unauthorised" }, { status: 401});
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "File must be 5MB or less" }, { status: 400 });
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: "Only PNG, JPG, and WEBP files are allowed" }, { status: 500});
    }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const filename = `user-${user.id}-${Date.now()}.${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profile-images");
    const filePath = path.join(uploadDir, filename);
    const publicUrl = `/uploads/profile-images/${filename}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    await db.query(
        `
        UPDATE users
        SET profile_image_url = ?
        WHERE id = ?
        `,
        [publicUrl, user.id]
    );
}