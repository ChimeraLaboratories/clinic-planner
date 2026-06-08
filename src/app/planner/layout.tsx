import PlannerTopBar from "@/app/planner/components/PlannerTopBar";
import { UserProvider } from "@/app/planner/context/UserContext";

export default function PlannerLayout({
                                          children,
                                      }: {
    children: React.ReactNode;
}) {
    return (
        <UserProvider>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
                <PlannerTopBar />

                <main className="p-6">
                    {children}
                </main>
            </div>
        </UserProvider>
    );
}