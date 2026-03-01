import {NextResponse} from "next/server";
import {getPlannerData} from "@/app/planner/services/plannerService";

export async function GET(req: Request) {
    const {searchParams} = new URL(req.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
        return NextResponse.json({error: "Missing from/to query parameter"},{status:400});
    }

    try {
        const data = await getPlannerData(from, to);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Planner API error:", error);
        return NextResponse.json({error: "Failed to load planner data"},{status:500});
    }
}