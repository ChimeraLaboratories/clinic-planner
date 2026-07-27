"use client";

import {
    AlertTriangle,
    X,
} from "lucide-react";

type ValidationAlertProps = {
    message: string;
    onDismiss?: () => void;
};

export default function ValidationAlert({
                                            message,
                                            onDismiss,
                                        }: ValidationAlertProps) {
    return (
        <div
            role="alert"
            className="
                flex items-start gap-3
                rounded-xl
                border border-red-200
                bg-red-50
                px-4 py-3
            "
        >
            <AlertTriangle
                className="
                    mt-0.5
                    h-5 w-5
                    shrink-0
                    text-red-600
                "
                aria-hidden="true"
            />

            <div className="min-w-0 flex-1">
                <p className="font-semibold text-red-900">
                    Errors
                </p>

                <ul className="mt-2 list-disc pl-5 text-sm text-red-800">
                    <li>{message}</li>
                </ul>
            </div>

            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    className="
                        -mr-1 -mt-1
                        inline-flex
                        h-8 w-8
                        shrink-0
                        items-center justify-center
                        rounded-lg
                        text-red-600
                        transition-colors
                        hover:bg-red-100
                        hover:text-red-800
                    "
                    aria-label="Dismiss error"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}