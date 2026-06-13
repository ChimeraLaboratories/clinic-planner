import PlannerTopBar from "@/app/planner/layout/components/PlannerTopBar";
import { UserProvider } from "@/app/planner/context/UserContext";
import {MonthNavigationProvider} from "@/app/planner/context/MonthNavigationContext";

export default function PlannerLayout({
                                          children,
                                      }: {
    children: React.ReactNode;
}) {
    return (
        <UserProvider>
            <MonthNavigationProvider>
                <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
                    <PlannerTopBar />

                    <main className="p-6">
                        {children}
                    </main>
                </div>
            </MonthNavigationProvider>
        </UserProvider>
    );
}