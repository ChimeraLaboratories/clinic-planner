"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Role = "ADMIN" | "PLANNER" | "VIEWER";

export type EditableUser = {
    id: number;
    email: string;
    full_name: string | null;
    role: Role;
    is_active: boolean;
};

type Props = {
    open: boolean;
    mode: "create" | "edit";
    user: EditableUser | null;
    onClose: () => void;
    onSaved: () => void;
};

export default function UserFormModal({ open, mode, user, onClose, onSaved }: Props) {
    const [mounted, setMounted] = useState(false);
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState<Role>("VIEWER");
    const [isActive, setIsActive] = useState(true);
    const [password, setPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!open) return;

        if (mode === "edit" && user) {
            setEmail(user.email ?? "");
            setFullName(user.full_name ?? "");
            setRole(user.role);
            setIsActive(user.is_active);
            setPassword("");
        } else {
            setEmail("");
            setFullName("");
            setRole("VIEWER");
            setIsActive(true);
            setPassword("");
        }

        setError(null);
    }, [open, mode, user]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const payload: any = {
                email,
                full_name: fullName,
                role,
                is_active: isActive,
            };

            if (mode === "create") {
                payload.password = password;
            } else if (password.trim()) {
                payload.password = password;
            }

            const res =
                mode === "create"
                    ? await fetch("/planner/api/admin/users", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    })
                    : await fetch(`/planner/api/admin/users/${user?.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data?.error || "Save failed");
            }

            onSaved();
            onClose();
        } catch (err: any) {
            setError(err?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    }

    if (!mounted || !open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            {mode === "create" ? "Add User" : "Edit User"}
                        </h2>
                        <p className="text-sm text-slate-500">
                            Manage who can edit clinics in Planner.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        Close
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-5">
                    {error ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    ) : null}

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Full name
                        </label>
                        <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            placeholder="Jane Smith"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            placeholder="jane@company.com"
                            required
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Role
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as Role)}
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            >
                                <option value="ADMIN">ADMIN</option>
                                <option value="PLANNER">PLANNER</option>
                                <option value="VIEWER">VIEWER</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                                Active user
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            {mode === "create" ? "Password" : "Reset password"}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            placeholder={
                                mode === "create"
                                    ? "Minimum 8 characters"
                                    : "Leave blank to keep current password"
                            }
                            required={mode === "create"}
                        />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                        <div><strong>ADMIN</strong> can manage users and edit clinics.</div>
                        <div><strong>PLANNER</strong> can edit clinics.</div>
                        <div><strong>VIEWER</strong> is read-only.</div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                        >
                            {saving ? "Saving..." : mode === "create" ? "Create User" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}