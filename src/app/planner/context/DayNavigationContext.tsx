"use client";

import { createContext, useContext, useState } from "react";

type DayNavigationValue = {
    selectedDate: Date | null;
    setSelectedDate: (date: Date | null) => void;
    showDaySwitcher: boolean;
    setShowDaySwitcher: (show: boolean) => void;
    onPrevDay: (() => void) | null;
    setOnPrevDay: (fn: (() => void) | null) => void;
    onNextDay: (() => void) | null;
    setOnNextDay: (fn: (() => void) | null) => void;
    onToday: (() => void) | null;
    setOnToday: (fn: (() => void) | null) => void;
};

const DayNavigationContext = createContext<DayNavigationValue | null>(null);

export function DayNavigationProvider({ children }: { children: React.ReactNode }) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showDaySwitcher, setShowDaySwitcher] = useState(false);

    const [onPrevDay, setOnPrevDay] = useState<(() => void) | null>(null);
    const [onNextDay, setOnNextDay] = useState<(() => void) | null>(null);
    const [onToday, setOnToday] = useState<(() => void) | null>(null);

    return (
        <DayNavigationContext.Provider
            value={{
                selectedDate,
                setSelectedDate,
                showDaySwitcher,
                setShowDaySwitcher,
                onPrevDay,
                setOnPrevDay,
                onNextDay,
                setOnNextDay,
                onToday,
                setOnToday,
            }}
        >
            {children}
        </DayNavigationContext.Provider>
    );
}

export function useDayNavigation() {
    const context = useContext(DayNavigationContext);

    if (!context) {
        throw new Error("useDayNavigation must be used inside DayNavigationProvider");
    }

    return context;
}