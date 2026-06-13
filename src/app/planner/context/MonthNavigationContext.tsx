"use client"

import {createContext, useContext, useState} from "react";

type MonthNavigationValue = {
    anchorMonth: Date | null;
    setAnchorMonth: (date: Date | null) => void;
    showMonthSwitcher: boolean;
    setShowMonthSwitcher: (show: boolean) => void;
    onPrevMonth: (() => void) | null;
    setOnPrevMonth: (fn: (() => void) | null) => void;
    onNextMonth: (() => void) | null;
    setOnNextMonth: (fn: (() => void) | null) => void;
    onCurrentMonth: (() => void) | null;
    setOnCurrentMonth: (fn: (() => void) | null) => void;
};

const MonthNavigationContext = createContext<MonthNavigationValue | null>(null);

export function MonthNavigationProvider({
    children,
    }: {
    children: React.ReactNode;
}) {
    const [anchorMonth, setAnchorMonth] = useState<Date | null>(null);
    const [showMonthSwitcher, setShowMonthSwitcher] = useState(false);
    const [onPrevMonth, setOnPrevMonth] = useState<(() => void) | null>(null);
    const [onNextMonth, setOnNextMonth] = useState<(() => void) | null>(null);
    const [onCurrentMonth, setOnCurrentMonth] = useState<(() => void) | null>(null);

    return (
        <MonthNavigationContext.Provider
            value={{
                anchorMonth,
                setAnchorMonth,
                showMonthSwitcher,
                setShowMonthSwitcher,
                onPrevMonth,
                setOnPrevMonth,
                onNextMonth,
                setOnNextMonth,
                onCurrentMonth,
                setOnCurrentMonth,
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