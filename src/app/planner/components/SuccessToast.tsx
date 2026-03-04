"use client";

import { useEffect } from "react";

export default function SuccessToast({
                                         open,
                                         title = "Saved",
                                         message,
                                         onClose,
                                         autoCloseMs = 2200,
                                     }: {
    open: boolean;
    title?: string;
    message: string;
    onClose: () => void;
    autoCloseMs?: number;
}) {
    useEffect(() => {
        if (!open) return;
        const t = window.setTimeout(onClose, autoCloseMs);
        return () => window.clearTimeout(t);
    }, [open, onClose, autoCloseMs]);

    if (!open) return null;

    return (
        <div className="fixed right-4 top-4 z-[110] w-full max-w-sm">
            <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-emerald-100 dark:border-emerald-900 border-t-[5px] border-t-emerald-500 overflow-hidden">
                <div className="p-5">
                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-lg font-bold">
                            ✓
                        </div>

                        <div className="flex-1">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                {title}
                            </h2>

                            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                                {message}
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition"
                            aria-label="Close"
                            title="Close"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}