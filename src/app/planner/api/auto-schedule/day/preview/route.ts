import { NextResponse } from "next/server";
import { previewAutoScheduleDay } from "@/lib/scheduler/autoScheduler";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const date = String(body?.date ?? "").trim();
        const overwriteExisting = Boolean(body?.overwriteExisting);

        const result = await previewAutoScheduleDay({
            date,
            overwriteExisting,
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[auto-schedule/day/preview]", error);
        return NextResponse.json(
            { error: error?.message || "Failed to preview auto schedule" },
            { status: 500 }
        );
    }
}