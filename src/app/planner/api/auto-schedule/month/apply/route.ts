import { NextResponse } from "next/server";
import { applyAutoScheduleMonth } from "@/lib/scheduler/autoScheduler";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const result = await applyAutoScheduleMonth({
            month: body?.month ? String(body.month).trim() : undefined,
            from: body?.from ? String(body.from).trim() : undefined,
            to: body?.to ? String(body.to).trim() : undefined,
            overwriteExisting: Boolean(body?.overwriteExisting),
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[auto-schedule/month/apply]", error);
        return NextResponse.json(
            { error: error?.message || "Failed to apply monthly auto schedule" },
            { status: 500 }
        );
    }
}