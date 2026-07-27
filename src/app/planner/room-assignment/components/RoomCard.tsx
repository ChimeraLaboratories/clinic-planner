"use client";

import { Download, Users } from "lucide-react";
import { Optometrist, Room } from "../types";
import OptometristCard from "./OptometristCard";

type Props = {
    room: Room;
    optometrists: Optometrist[];
    onDropOptometrist: (roomId: string) => void;
    onDragStart: (optometristId: string) => void;
};

export default function RoomCard({
                                     room,
                                     optometrists,
                                     onDropOptometrist,
                                     onDragStart,
                                 }: Props) {
    const headerClass =
        room.type === "ground"
            ? "bg-emerald-50 text-slate-900 border-emerald-200"
            : room.type === "contact"
                ? "bg-violet-50 text-slate-900 border-violet-200"
                : "bg-blue-50 text-slate-900 border-blue-200";

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div
                className={`flex h-12 items-center justify-between border-b px-4 ${headerClass}`}
            >
                <h3 className="text-sm font-bold">{room.name}</h3>

                <div className="flex items-center gap-1 text-sm text-blue-700">
                    <Users className="h-4 w-4" />
                    {optometrists.length}
                </div>
            </div>

            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDropOptometrist(String(room.id))}
                className="min-h-[180px] p-4"
            >
                {optometrists.length === 0 ? (
                    <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-500">
                        <Download className="mb-2 h-7 w-7" />
                        <span className="text-sm">Drop here</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {optometrists.map((optometrist) => (
                            <OptometristCard
                                key={optometrist.id}
                                optometrist={optometrist}
                                onDragStart={() => onDragStart(String(optometrist.id))}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}