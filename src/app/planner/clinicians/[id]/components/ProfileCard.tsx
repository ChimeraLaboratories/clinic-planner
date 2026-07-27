import { ReactNode } from "react";

type ProfileCardProps = {
    title?: string;
    icon?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
};

/**
 * Shared card shell for clinician profile sections.
 * Keeps spacing, borders and headings consistent across the profile area.
 */
export default function ProfileCard({ title, icon, action, children }: ProfileCardProps) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {(title || action) && (
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                {icon}
                            </div>
                        )}

                        {title && (
                            <h2 className="text-base font-bold text-slate-950">
                                {title}
                            </h2>
                        )}
                    </div>

                    {action}
                </div>
            )}

            <div className="p-6">{children}</div>
        </section>
    );
}