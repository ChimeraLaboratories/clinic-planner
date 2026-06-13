"use client"

import {createContext, useContext, useState} from "react";

type MonthNavigationValue = {
    anchorMonth: Date | null;
    setAnchorMonth: (date: Date | null) => void;
    showMonthSwitcher: boolean;
    setShowMonthSwitcher: (show: boolean) => void;
};

const MonthNavigationContext = createContext<MonthNavigationValue | null>(null);

export function MonthNavigationProvider({
    children,
    }: {
    children: React.ReactNode;
}) {
    const [anchorMonth, setAnchorMonth] = useState<Date | null>(null);
    const [showMonthSwitcher, setShowMonthSwitcher] = useState(false);

    return (
        <MonthNavigationContext.Provider
            value={{
                anchorMonth,
                setAnchorMonth,
                showMonthSwitcher,
                setShowMonthSwitcher,
            }}>
            {children}
        </MonthNavigationContext.Provider>
    );
}

export function useMonthNavigation() {
    const context = useContext(MonthNavigationContext);

    if (!context) {
        throw new Error("useMonthNavigation must be used inside MonthNavigationProvider");
    }

    return context;
}