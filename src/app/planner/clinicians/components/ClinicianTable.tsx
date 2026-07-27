"use client";

import { useRouter } from "next/navigation";
import type { Clinician } from "../types";
import ClinicianActionsMenu from "./ClinicianActionsMenu";
import {getAvatarColour} from "@/lib/avatarColours";

const roleLabel = (roleCode: number) => (roleCode === 1 ? "OO" : roleCode === 2 ? "CLO" : String(roleCode));
const gradeLabel = (gradeCode: number) => (gradeCode === 1 ? "Registered" : gradeCode === 2 ? "Pre-Reg" : String(gradeCode));

function initials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export default function ClinicianTable({ clinicians }: { clinicians: Clinician[] }) {
    const router = useRouter();

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                        <th className="px-5 py-4">Clinician</th>
                        <th className="px-5 py-4">Role</th>
                        <th className="px-5 py-4">Grade</th>
                        <th className="px-5 py-4">Supervisor</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Profile Health</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {clinicians.map((clinician) => (
                        <tr
                            key={clinician.id}
                            onClick={() => router.push(`/planner/clinicians/${clinician.id}/day-rules`)}
                            className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-900/70"
                        >
                            <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${getAvatarColour(clinician.id)}`}>
                                        {initials(clinician.full_name)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-950 dark:text-white">
                                            {clinician.full_name}
                                        </p>
                                    </div>
                                </div>
                            </td>

                            <td className="px-5 py-4">
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                    {roleLabel(clinician.role_code)}
                  </span>
                            </td>

                            <td className="px-5 py-4">
                  <span className={clinician.grade_code === 2 ? "rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-200" : "text-slate-700 dark:text-slate-300"}>
                    {gradeLabel(clinician.grade_code)}
                  </span>
                            </td>

                            <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold
      ${
                                            clinician.is_supervisor
                                                ? "border-emerald-500 text-emerald-600"
                                                : "border-slate-300 text-slate-400 dark:border-slate-700 dark:text-slate-500"
                                        }`}
                                    >
                                        {clinician.is_supervisor ? "✓" : "✕"}
                                    </div>

                                    <span
                                        className={`text-sm font-medium ${
                                            clinician.is_supervisor
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : "text-slate-500 dark:text-slate-400"
                                        }`}
                                    >
      {clinician.is_supervisor ? "Yes" : "No"}
    </span>
                                </div>
                            </td>

                            <td className="px-5 py-4">
                  <span className={clinician.is_active ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200" : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"}>
                    {clinician.is_active ? "Active" : "Inactive"}
                  </span>
                            </td>

                            <td className="px-5 py-4">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                    Complete
                  </span>
                            </td>

                            <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <ClinicianActionsMenu clinician={clinician} />
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}