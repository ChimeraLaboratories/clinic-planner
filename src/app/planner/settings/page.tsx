import {SettingsForm} from "@/app/planner/settings/components/SettingsForm";

export default function SettingsPage() {
    return(
        <div className="space-y-6">
            <div>
                <h1 className="text-2x1 font-bold">Settings</h1>
                <p className="text-slate-500">
                    Manage your personal preferences.
                </p>
            </div>

            <SettingsForm />
        </div>
    )
}