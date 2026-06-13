import { getCurrentUserFromCookies, toPublicUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { mkdir, unlink, writeFile } from "node:fs/promises";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const PROFILE_IMAGE_FOLDER = "/uploads/profile-images/";

type ProfileImageRow = {
    profile_image_url: string | null;
};

async function getCurrentProfileImageUrl(userId: number) {
    const [rows] = await db.query(
        `
        SELECT profile_image_url
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId]
    );

    const users = rows as ProfileImageRow[];

    return users[0]?.profile_image_url ?? null;
}

async function deleteOldProfileImage(imageUrl: string | null) {
    if (!imageUrl) return;

    if (!imageUrl.startsWith(PROFILE_IMAGE_FOLDER)) return;

    const filePath = path.join(process.cwd(), "public", imageUrl);

    try {
        await unlink(filePath);
    } catch (error: any) {
        if (error.code !== "ENOENT") {
            console.error("Failed to delete old profile image:", error);
        }
    }
}

export async function POST(req: NextRequest) {
    const user = await getCurrentUserFromCookies();

    if (!user) {
        return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
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
        return NextResponse.json(
            { error: "Only PNG, JPG, and WEBP files are allowed" },
            { status: 400 }
        );
    }

    const oldImageUrl = await getCurrentProfileImageUrl(user.id);

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const filename = `user-${user.id}-${Date.now()}.${extension}`;

    const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "profile-images"
    );

    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    const publicUrl = `${PROFILE_IMAGE_FOLDER}${filename}`;

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

    await deleteOldProfileImage(oldImageUrl);

    return NextResponse.json({
        ...toPublicUser(user),
        profile_image_url: publicUrl,
    });
}

export async function DELETE() {
    const user = await getCurrentUserFromCookies();

    if (!user) {
        return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const oldImageUrl = await getCurrentProfileImageUrl(user.id);

    await db.query(
        `
        UPDATE users
        SET profile_image_url = NULL
        WHERE id = ?
        `,
        [user.id]
    );

    await deleteOldProfileImage(oldImageUrl);

    return NextResponse.json({
        ...toPublicUser(user),
        profile_image_url: null,
    });
}