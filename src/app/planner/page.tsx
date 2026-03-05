"use client";

import PlannerController from "./controllers/PlannerController";
import {Suspense} from "react";

export default function Page() {
    return (
        <Suspense fallback={null}>
            <PlannerController />
        </Suspense>
    )
}