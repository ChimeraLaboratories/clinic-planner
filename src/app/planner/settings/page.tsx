import Link from "next/link";

const settingsSections = [
    {
        title: "Profile",
        description: "Manage your name, email, job role, and profile picture.",
        href: "/planner/settings/profile",
    },
    {
        title: "Preferences",
        description: "Manage your calendar view, theme, weekends, and display options.",
        href: "/planner/settings/preferences",
    },
];

export default function SettingsPage() {
    return (
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                    Settings
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Manage your account and personal Clinic Planner preferences.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {settingsSections.map((section) => (
                    <Link
                        key={section.href}
                        href={section.href}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                    >
                        <h2 className="text-lg font-semibold text-slate-900">
                            {section.title}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            {section.description}
                        </p>
                        <p className="mt-4 text-sm font-medium text-blue-600">
                            Open {section.title} →
                        </p>
                    </Link>
                ))}
            </div>
        </main>
    );
}