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

                // ✅ After creating, go straight to Day Rules for the new clinician
                const newId =
                    data?.clinician_id ??
                    data?.id ??
                    data?.clinician?.id ??
                    data?.result?.insertId ??
                    data?.insertId;

                if (newId) {
                    router.push(`/planner/clinicians/${newId}/day-rules`);
                } else {
                    // fallback if API didn't return an id
                    router.push("/planner/clinicians");
                }
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
        <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm dark:shadow-none">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                        {mode === "new" ? "Add Clinician" : "Edit Clinician"}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-slate-400">
                        Role: {roleLabel(roleCode)} · Grade: {gradeLabel(gradeCode)}
                    </div>
                </div>

                <button
                    onClick={() => router.push("/planner/clinicians")}
                    className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900 text-gray-700 dark:text-slate-200"
                    disabled={saving}
                >
                    Back to list
                </button>
            </div>

            <div className="mt-4 grid gap-3">
                <label className="text-sm text-gray-900 dark:text-slate-200">
                    Full name
                    <input
                        className="mt-1 w-full border border-gray-200 dark:border-slate-800 rounded p-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Cane Emmingham"
                    />
                </label>

                <label className="text-sm text-gray-900 dark:text-slate-200">
                    Display name
                    <input
                        className="mt-1 w-full border border-gray-200 dark:border-slate-800 rounded p-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Cane"
                    />
                </label>

                <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm text-gray-900 dark:text-slate-200">
                        Role
                        <select
                            className="mt-1 w-full border border-gray-200 dark:border-slate-800 rounded p-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                            value={roleCode}
                            onChange={(e) => setRoleCode(Number(e.target.value))}
                        >
                            <option value={1}>OO</option>
                            <option value={2}>CLO</option>
                        </select>
                    </label>

                    <label className="text-sm text-gray-900 dark:text-slate-200">
                        Grade
                        <select
                            className="mt-1 w-full border border-gray-200 dark:border-slate-800 rounded p-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                            value={gradeCode}
                            onChange={(e) => setGradeCode(Number(e.target.value))}
                        >
                            <option value={1}>Registered</option>
                            <option value={2}>Pre-Reg</option>
                        </select>
                    </label>
                </div>

                <label className="text-sm text-gray-900 dark:text-slate-200">
                    GOC number (optional)
                    <input
                        className="mt-1 w-full border border-gray-200 dark:border-slate-800 rounded p-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        value={goc}
                        onChange={(e) => setGoc(e.target.value)}
                        placeholder="Optional"
                    />
                </label>

                <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-sm border border-gray-200 dark:border-slate-800 rounded p-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200">
                        <input
                            type="checkbox"
                            checked={isSupervisor}
                            onChange={(e) => setIsSupervisor(e.target.checked)}
                        />
                        Supervisor
                    </label>

                    <label className="flex items-center gap-2 text-sm border border-gray-200 dark:border-slate-800 rounded p-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                        />
                        Active
                    </label>
                </div>

                {err && <div className="text-sm text-red-600 dark:text-red-300">{err}</div>}

                <button
                    onClick={save}
                    disabled={saving}
                    className="mt-1 rounded bg-slate-900 px-3 py-2 text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
                >
                    {saving ? "Saving…" : mode === "new" ? "Create clinician" : "Save changes"}
                </button>

                <div className="text-xs text-gray-500 dark:text-slate-400">
                    Tip: Set inactive instead of deleting to preserve historic session links.
                </div>
            </div>
        </div>
    );
}