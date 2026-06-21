import type {
    ClinicianGradeFilter,
    ClinicianRoleFilter,
    ClinicianStatusFilter,
    ClinicianSupervisorFilter,
} from "../types";

type Props = {
    search: string;
    status: ClinicianStatusFilter;
    role: ClinicianRoleFilter;
    grade: ClinicianGradeFilter;
    supervisor: ClinicianSupervisorFilter;
    onSearchChange: (value: string) => void;
    onStatusChange: (value: ClinicianStatusFilter) => void;
    onRoleChange: (value: ClinicianRoleFilter) => void;
    onGradeChange: (value: ClinicianGradeFilter) => void;
    onSupervisorChange: (value: ClinicianSupervisorFilter) => void;
};

export default function ClinicianFilters(props: Props) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
                <input
                    value={props.search}
                    onChange={(e) => props.onSearchChange(e.target.value)}
                    placeholder="Search clinicians..."
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />

                <select value={props.role} onChange={(e) => props.onRoleChange(e.target.value as ClinicianRoleFilter)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                    <option value="all">All roles</option>
                    <option value="oo">OO</option>
                    <option value="clo">CLO</option>
                </select>

                <select value={props.grade} onChange={(e) => props.onGradeChange(e.target.value as ClinicianGradeFilter)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                    <option value="all">All grades</option>
                    <option value="registered">Registered</option>
                    <option value="pre-reg">Pre-Reg</option>
                </select>

                <select value={props.supervisor} onChange={(e) => props.onSupervisorChange(e.target.value as ClinicianSupervisorFilter)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                    <option value="all">All supervisors</option>
                    <option value="yes">Supervisor</option>
                    <option value="no">Not supervisor</option>
                </select>

                <select value={props.status} onChange={(e) => props.onStatusChange(e.target.value as ClinicianStatusFilter)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                    <option value="all">All status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>
        </div>
    );
}