import PlannerTopBar from "@/app/planner/layout/components/PlannerTopBar";
import { UserProvider } from "@/app/planner/context/UserContext";
import {MonthNavigationProvider} from "@/app/planner/context/MonthNavigationContext";
import {DayNavigationProvider} from "@/app/planner/context/DayNavigationContext";

export default function PlannerLayout({
                                          children,
                                      }: {
    children: React.ReactNode;
}) {
    return (
        <UserProvider>
            <DayNavigationProvider>
                <MonthNavigationProvider>
                    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
                        <PlannerTopBar />

                        <main className="p-6">
                            {children}
                        </main>
                    </div>
                </MonthNavigationProvider>
            </DayNavigationProvider>
        </UserProvider>
    );
}