"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ErrorModal({
                                       open,
                                       title = "Action could not be completed",
                                       message,
                                       onClose,
                                   }: {
    open: boolean;
    title?: string;
    message: string;
    onClose: () => void;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Close on Escape
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        if (open) window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    if (!open || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-red-100 border-t-[5px] border-t-red-500 overflow-hidden">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 text-lg font-bold">
                            !
                        </div>

                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>

                            <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {message}
                            </p>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}