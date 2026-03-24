"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import UserFormModal, { EditableUser } from "./UserFormModal";

type ApiUser = EditableUser & {
    created_at?: string;
    updated_at?: string;
};

export default function UserManagementClient() {
    const [users, setUsers] = useState<ApiUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [selectedUser, setSelectedUser] = useState<EditableUser | null>(null);

    async function loadUsers(q?: string) {
        setLoading(true);
        setError(null);

        try {
            const url = q?.trim()
                ? `/planner/api/admin/users?search=${encodeURIComponent(q.trim())}`
                : `/planner/api/admin/users`;

            const res = await fetch(url, { cache: "no-store" });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data?.error || "Failed to load users");
            }

            setUsers(data.users || []);
        } catch (err: any) {
            setError(err?.message || "Failed to load users");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    const counts = useMemo(() => {
        return {
            total: users.length,
            active: users.filter((u) => u.is_active).length,
            editors: users.filter((u) => u.role === "ADMIN" || u.role === "PLANNER").length,
            viewers: users.filter((u) => u.role === "VIEWER").length,
        };
    }, [users]);

    function openCreate() {
        setSelectedUser(null);
        setModalMode("create");
        setModalOpen(true);
    }

    function openEdit(user: EditableUser) {
        setSelectedUser(user);
        setModalMode("edit");
        setModalOpen(true);
    }

    return (
        <div className="mx-auto max-w-7xl p-4 md:p-6">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="mb-2">
                        <Link
                            href="/planner"
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            ← Back to Planner
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        User Management
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Add and edit users who can access and edit clinics.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => loadUsers(search)}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={openCreate}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        Add User
                    </button>
                </div>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Users</div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">{counts.total}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Active</div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">{counts.active}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Can Edit Clinics</div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">{counts.editors}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">View Only</div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">{counts.viewers}</div>
                </div>
            </div>

            <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") loadUsers(search);
                        }}
                        placeholder="Search by name, email or role"
                        className="w-full max-w-md rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                    <div className="text-sm text-slate-500">
                        Roles decide clinic edit access.
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {loading ? (
                    <div className="p-6 text-sm text-slate-500">Loading users...</div>
                ) : error ? (
                    <div className="p-6 text-sm text-red-600">{error}</div>
                ) : users.length === 0 ? (
                    <div className="p-6 text-sm text-slate-500">No users found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50">
                            <tr className="text-left text-slate-600">
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Role</th>
                                <th className="px-4 py-3 font-medium">Clinic Access</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {users.map((user) => {
                                const canEdit = user.role === "ADMIN" || user.role === "PLANNER";

                                return (
                                    <tr key={user.id} className="border-t border-slate-200">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">
                                                {user.full_name || "—"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">{user.email}</td>
                                        <td className="px-4 py-3">
                                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                                                    {user.role}
                                                </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {canEdit ? (
                                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                                        Can edit clinics
                                                    </span>
                                            ) : (
                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                        Read only
                                                    </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.is_active ? (
                                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                                        Active
                                                    </span>
                                            ) : (
                                                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                                                        Inactive
                                                    </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => openEdit(user)}
                                                className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <UserFormModal
                open={modalOpen}
                mode={modalMode}
                user={selectedUser}
                onClose={() => setModalOpen(false)}
                onSaved={() => loadUsers(search)}
            />
        </div>
    );
}