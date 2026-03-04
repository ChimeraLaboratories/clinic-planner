"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
    const { theme, setTheme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Avoid rendering until mounted to prevent hydration mismatch
    if (!mounted) {
        return (
            <button
                type="button"
                aria-label="Toggle theme"
                className="h-9 w-9 rounded-md border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/60"
            />
        );
    }

    const resolvedTheme = theme === "system" ? systemTheme : theme;
    const isDark = resolvedTheme === "dark";

    return (
        <button
            type="button"
            aria-label="Toggle theme"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white/60 text-slate-700 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            {/* simple icon without extra deps */}
            <span className="text-sm">{isDark ? "🌙" : "☀️"}</span>
        </button>
    );
}