"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Clinician = {
    id?: number;
    full_name: string;
    display_name: string;
    role_code: number;      // 1 OO, 2 CLO
    grade_code: number;     // 1 Registered, 2 Pre-reg
    GOC_number: string | null;
    is_supervisor: number;  // 0/1
    is_active: number;      // 0/1
};

export default function ClinicianFormClient({
                                                mode,
                                                initial,
                                                clinicianId,
                                            }: {
    mode: "new" | "edit";
    initial: Clinician;
    clinicianId?: number;
}) {
    const router = useRouter();

    const [fullName, setFullName] = useState(initial.full_name ?? "");
    const [displayName, setDisplayName] = useState(initial.display_name ?? "");
    const [roleCode, setRoleCode] = useState<number>(Number(initial.role_code ?? 1));
    const [gradeCode, setGradeCode] = useState<number>(Number(initial.grade_code ?? 1));
    const [goc, setGoc] = useState<string>(initial.GOC_number ?? "");
    const [isSupervisor, setIsSupervisor] = useState<boolean>(Boolean(initial.is_supervisor));
    const [isActive, setIsActive] = useState<boolean>(initial.is_active !== 0);

    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // Helpful: auto fill display name from full name if empty (only in NEW mode)
    useEffect(() => {
        if (mode === "new" && !displayName.trim() && fullName.trim()) {
            // default to first name
            const first = fullName.trim().split(/\s+/)[0];
            setDisplayName(first);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fullName]);

    const roleLabel = (rc: number) => (rc === 1 ? "OO" : rc === 2 ? "CLO" : String(rc));
    const gradeLabel = (gc: number) => (gc === 1 ? "Registered" : gc === 2 ? "Pre-reg" : String(gc));

    const payload = useMemo(() => {
        return {
            full_name: fullName.trim(),
            display_name: displayName.trim(),
            role_code: roleCode,
            grade_code: gradeCode,
            GOC_number: goc.trim() ? goc.trim() : null,
            is_supervisor: isSupervisor ? 1 : 0,
            is_active: isActive ? 1 : 0,
        };
    }, [fullName, displayName, roleCode, gradeCode, goc, isSupervisor, isActive]);

    async function save() {
        setErr(null);

        if (!payload.full_name) return setErr("Full name is required");
        if (!payload.display_name) return setErr("Display name is required");
        if (![1, 2].includes(payload.role_code)) return setErr("Role must be OO or CLO");
        if (![1, 2].includes(payload.grade_code)) return setErr("Grade must be Registered or Pre-reg");

        setSaving(true);
        try {
            if (mode === "new") {
                const res = await fetch("/planner/api/clinicians", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    setErr(data?.error ?? "Failed to create clinician");
                    return;
                }

                router.push("/planner/clinicians");
                router.refresh();
            } else {
                if (!clinicianId) {
                    setErr("Missing clinician id");
                    return;
                }

                const res = await fetch(`/planner/api/clinicians/${clinicianId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    setErr(data?.error ?? "Failed to update clinician");
                    return;
                }

                router.push("/planner/clinicians");
                router.refresh();
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-lg font-semibold">
                        {mode === "new" ? "Add Clinician" : "Edit Clinician"}
                    </div>
                    <div className="text-sm text-gray-500">
                        Role: {roleLabel(roleCode)} · Grade: {gradeLabel(gradeCode)}
                    </div>
                </div>

                <button
                    onClick={() => router.push("/planner/clinicians")}
                    className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                    disabled={saving}
                >
                    Back to list
                </button>
            </div>

            <div className="mt-4 grid gap-3">
                <label className="text-sm">
                    Full name
                    <input
                        className="mt-1 w-full border rounded p-2"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Cane Emmingham"
                    />
                </label>

                <label className="text-sm">
                    Display name
                    <input
                        className="mt-1 w-full border rounded p-2"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Cane"
                    />
                </label>

                <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm">
                        Role
                        <select
                            className="mt-1 w-full border rounded p-2"
                            value={roleCode}
                            onChange={(e) => setRoleCode(Number(e.target.value))}
                        >
                            <option value={1}>OO</option>
                            <option value={2}>CLO</option>
                        </select>
                    </label>

                    <label className="text-sm">
                        Grade
                        <select
                            className="mt-1 w-full border rounded p-2"
                            value={gradeCode}
                            onChange={(e) => setGradeCode(Number(e.target.value))}
                        >
                            <option value={1}>Registered</option>
                            <option value={2}>Pre-Reg</option>
                        </select>
                    </label>
                </div>

                <label className="text-sm">
                    GOC number (optional)
                    <input
                        className="mt-1 w-full border rounded p-2"
                        value={goc}
                        onChange={(e) => setGoc(e.target.value)}
                        placeholder="Optional"
                    />
                </label>

                <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-sm border rounded p-2">
                        <input
                            type="checkbox"
                            checked={isSupervisor}
                            onChange={(e) => setIsSupervisor(e.target.checked)}
                        />
                        Supervisor
                    </label>

                    <label className="flex items-center gap-2 text-sm border rounded p-2">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                        />
                        Active
                    </label>
                </div>

                {err && <div className="text-sm text-red-600">{err}</div>}

                <button
                    onClick={save}
                    disabled={saving}
                    className="mt-1 rounded bg-slate-900 px-3 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
                >
                    {saving ? "Saving…" : mode === "new" ? "Create clinician" : "Save changes"}
                </button>

                <div className="text-xs text-gray-500">
                    Tip: Set inactive instead of deleting to preserve historic session links.
                </div>
            </div>
        </div>
    );
}