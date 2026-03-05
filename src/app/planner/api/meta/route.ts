import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Env = "DEV" | "QA" | "STAGE" | "PROD";

function normalizeEnv(v: any): Env {
    const s = String(v ?? "").trim().toUpperCase();
    if (s === "DEV" || s === "QA" || s === "STAGE" || s === "PROD") return s;
    return process.env.NODE_ENV === "production" ? "PROD" : "DEV";
}

function shortSha(sha: any): string | null {
    const s = String(sha ?? "").trim();
    if (!s) return null;
    return s.slice(0, 7);
}

export async function GET() {
    const env = normalizeEnv(process.env.APP_ENV || process.env.CLINIC_ENV);

    const commit =
        shortSha(process.env.VERCEL_GIT_COMMIT_SHA) ||
        shortSha(process.env.GIT_SHA) ||
        null;

    // You can set APP_VERSION manually, or derive it from package.json in CI
    const version = (process.env.APP_VERSION || "").trim() || null;

    // You can set BUILD_TIME in CI as an ISO string
    const buildTime = (process.env.BUILD_TIME || "").trim() || null;

    // Optional (Vercel provides these sometimes; otherwise null)
    const region = (process.env.VERCEL_REGION || "").trim() || null;

    return NextResponse.json(
        { env, version, commit, buildTime, region },
        { headers: { "cache-control": "no-store" } }
    );
}