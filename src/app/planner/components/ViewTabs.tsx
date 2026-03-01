"use client";

export default function ViewTabs() {
    return (
        <div className="flex gap-6 border-b">
            <button className="border-b-2 border-blue-600 pb-3 text-blue-600 font-medium">Month View</button>
            <button className="pb-3 text-slate-500">Week View</button>
        </div>
    );
}