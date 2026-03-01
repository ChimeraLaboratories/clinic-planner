import {NextResponse} from "next/server";
import {createSession} from "@/app/planner/services/plannerService";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const {
            session_date,
            room_id,
            clinician_id,
            session_type = "ST",
            slot = "FULL",
            status = "DRAFT",
            notes = null,
        } = body;

        if (!session_date || !room_id) {
            return NextResponse.json({error: "session_date and room_id are requred"}, {status:400});
        }

        await createSession({
            session_date,
            room_id: Number(room_id),
            clinician_id: clinician_id === null || clinician_id === "" || clinician_id === undefined ? null : Number(clinician_id),
            session_type,
            slot,
            status,
            notes,
        });

        return NextResponse.json({success:true},{status:201});
    } catch (error: any) {
        if (error?.code === "SESSION_CONFLICT") {
            return NextResponse.json({error: error.message}, {status:400});
        }

        if (error?.code === "ER_DUP_ENTRY") {
            return NextResponse.json({error: "Session already exists for this room/date/slot"}, {status: 409});
        }

        console.error("Create session error:", error);

        return NextResponse.json({error:"Failed to create session"},{status:500});
    }
}