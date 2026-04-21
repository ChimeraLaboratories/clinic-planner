import { NextResponse } from "next/server";
import { previewAutoScheduleMonth } from "@/lib/scheduler/autoScheduler";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const result = await previewAutoScheduleMonth({
            month: body?.month ? String(body.month).trim() : undefined,
            from: body?.from ? String(body.from).trim() : undefined,
            to: body?.to ? String(body.to).trim() : undefined,
            overwriteExisting: Boolean(body?.overwriteExisting),
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[auto-schedule/month/preview]", error);
        return NextResponse.json(
            { error: error?.message || "Failed to preview monthly auto schedule" },
            { status: 500 }
        );
    }
}