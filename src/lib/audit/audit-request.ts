import { headers } from "next/headers";

export async function getRequestAuditContext() {
    const h = await headers();

    const forwardedFor = h.get("x-forwarded-for");
    const realIp = h.get("x-real-ip");

    const ipAddress =
        forwardedFor?.split(",")[0]?.trim() ||
        realIp ||
        null;

    const userAgent = h.get("user-agent") || null;

    return {
        ipAddress,
        userAgent,
    };
}