import { NextResponse } from "next/server";
import { applyAutoScheduleDay } from "@/lib/scheduler/autoScheduler";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const date = String(body?.date ?? "").trim();
        const overwriteExisting = Boolean(body?.overwriteExisting);

        const result = await applyAutoScheduleDay({
            date,
            overwriteExisting,
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[auto-schedule/day/apply]", error);
        return NextResponse.json(
            { error: error?.message || "Failed to apply auto schedule" },
            { status: 500 }
        );
    }
}