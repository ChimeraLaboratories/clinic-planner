import PlannerTopBar from "@/app/planner/components/PlannerTopBar";

export default function PlannerLayout({children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <PlannerTopBar />

            <main className="p-6">
                {children}
            </main>
        </div>
    )
}