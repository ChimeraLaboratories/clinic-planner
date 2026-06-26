import type { Clinician, Pattern } from "./types";
import {Save} from "lucide-react";
import {getAvatarColour} from "@/lib/avatarColours";

function initials(name: string) {
    return name
        .split(" ")
        .map((x) => x[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export function ClinicianTemplateHeader({
                                            clinician,
                                            pattern,
                                            setPattern,
                                            saving,
                                            onSave,
                                        }: {
    clinician: Clinician;
    pattern: Pattern;
    setPattern: (p: Pattern) => void;
    saving: boolean;
    onSave: () => void;
}) {
    const grade = clinician.grade_code === 2 ? "Pre-Reg Optom" : "Registered Optom";

    return (
        <div className="border-b border-slate-200 pb-6">
            <div className="flex items-end justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className={`flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full text-[22px] font-bold ${getAvatarColour(clinician.id)}`}>
                        {initials(clinician.full_name)}
                    </div>

                    <div>
                        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em]">{clinician.full_name}</h1>

                        <div className="mt-3 flex items-center gap-3">
              <span className="inline-flex h-8 min-w-[150px] items-center justify-center whitespace-nowrap rounded-lg bg-violet-50 px-4 text-sm font-bold text-violet-700">
                {grade}
              </span>
                            <span className="inline-flex h-8 items-center rounded-lg bg-emerald-50 px-4 text-sm font-bold text-emerald-700">
                {clinician.is_active ? "Active" : "Inactive"}
              </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-end gap-6">
                    <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-500">
              Week Template
            </span>
                        <select
                            className="h-14 w-[360px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold shadow-sm outline-none"
                            value={pattern}
                            onChange={(e) => setPattern(e.target.value as Pattern)}
                        >
                            <option value="W1">Week A — Alternate week set 1</option>
                            <option value="W2">Week B — Alternate week set 2</option>
                        </select>
                    </label>

                    <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                        <button
                            onClick={() => setPattern("W1")}
                            className={`h-12 w-28 rounded-lg text-sm font-bold ${
                                pattern === "W1" ? "bg-blue-600 text-white shadow" : "text-slate-700"
                            }`}
                        >
                            Week A
                        </button>
                        <button
                            onClick={() => setPattern("W2")}
                            className={`h-12 w-28 rounded-lg text-sm font-bold ${
                                pattern === "W2" ? "bg-blue-600 text-white shadow" : "text-slate-700"
                            }`}
                        >
                            Week B
                        </button>
                    </div>

                    <button className="h-14 rounded-xl border border-slate-200 bg-white px-7 text-sm font-bold shadow-sm">
                        ⧉ Copy Week A to Week B
                    </button>

                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="inline-flex h-14 min-w-[180px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                    >
                        <Save className="h-4 w-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">
        {saving ? "Saving..." : "Save changes"}
    </span>
                    </button>
                </div>
            </div>
        </div>
    );
}