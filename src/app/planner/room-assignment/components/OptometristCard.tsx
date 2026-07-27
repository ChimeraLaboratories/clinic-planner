"use client";

import { GripVertical } from "lucide-react";
import { Optometrist } from "../types";
import {getAvatarColour} from "@/lib/avatarColours";

type Props = {
    optometrist: Optometrist;
    draggable?: boolean;
    onDragStart?: () => void;
};

export default function OptometristCard({
                                            optometrist,
                                            draggable = true,
                                            onDragStart,
                                        }: Props) {
    return (
        <div
            draggable={draggable}
            onDragStart={onDragStart}
            className="flex h-14 cursor-grab items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 shadow-sm active:cursor-grabbing"
        >
            <GripVertical className="h-4 w-4 text-slate-400" />

            <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${getAvatarColour(
                    optometrist.id,
                )}`}
            >
                {optometrist.initials}
            </div>

            <span className="text-sm font-medium text-slate-900">
        {optometrist.fullName}
      </span>
        </div>
    );
}