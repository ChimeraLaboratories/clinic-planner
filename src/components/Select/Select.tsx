"use client";

import * as Popover from "@radix-ui/react-popover";
import {Check, ChevronDown, RefreshCw} from "lucide-react";
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

export type SelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
};

type SelectProps = {
    value: string;
    options: SelectOption[];
    placeholder?: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
    loading?: boolean;
};

export default function Select({
                                   value,
                                   options,
                                   placeholder = "Select an option…",
                                   onValueChange,
                                   disabled = false,
                                   loading = false,
                               }: SelectProps) {
    const [open, setOpen] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        requestAnimationFrame(() => {
            contentRef.current?.focus();
        });
    }, [open]);

    const selectedOption = useMemo(
        () =>
            options.find(
                (option) => option.value === value,
            ) ?? null,
        [options, value],
    );

    function handleSelect(option: SelectOption) {
        if (option.disabled || disabled || loading) {
            return;
        }

        onValueChange(option.value);
        setOpen(false);
    }

    return (
        <Popover.Root
            open={open}
            onOpenChange={(nextOpen) => {
                if (disabled || loading) return;
                setOpen(nextOpen);
            }}
        >
            <Popover.Trigger asChild>
                <button
                    type="button"
                    disabled={disabled || loading}
                    className={[
                        "flex min-h-11 w-full items-center justify-between gap-3",
                        "rounded-lg border border-slate-300 bg-white px-3 py-2",
                        "text-left text-sm text-slate-900 shadow-sm",
                        "outline-none transition-all duration-150",
                        "hover:border-slate-400 hover:shadow-sm",
                        "focus-visible:border-emerald-700",
                        "focus-visible:ring-2 focus-visible:ring-emerald-100",
                        "disabled:cursor-not-allowed",
                        loading
                            ? "bg-slate-100 text-slate-500"
                            : "",
                        disabled && !loading
                            ? "bg-slate-100 text-slate-500 opacity-70"
                            : "",
                        "dark:border-slate-700 dark:bg-slate-900",
                        "dark:text-slate-100",
                        "dark:hover:border-slate-600",
                        "dark:focus-visible:border-emerald-500",
                        "dark:focus-visible:ring-emerald-950",
                    ].join(" ")}
                >
<span className="min-w-0 flex-1 truncate">
    {selectedOption?.label ?? placeholder}
</span>

                    {loading ? (
                        <RefreshCw
                            className="clinician-loader h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400"
                            strokeWidth={3}
                        />
                    ) : (
                        <ChevronDown
                            className={[
                                "h-4 w-4 shrink-0 text-slate-600",
                                "transition-transform",
                                open ? "rotate-180" : "",
                                "dark:text-slate-300",
                            ].join(" ")}
                            aria-hidden="true"
                        />
                    )}
                </button>
            </Popover.Trigger>

            <Popover.Portal>
                <Popover.Content
                    ref={contentRef}
                    tabIndex={-1}
                    side="bottom"
                    align="start"
                    sideOffset={4}
                    collisionPadding={12}
                    className={[
                        "z-[100] min-w-[var(--radix-popover-trigger-width)]",
                        "overflow-hidden rounded-lg border border-slate-300 bg-white",
                        "shadow-xl",
                        "dark:border-slate-700 dark:bg-slate-900",
                    ].join(" ")}
                >
                    <div className="max-h-72 overflow-y-auto py-1">
                        {options.map((option) => {
                            const selected =
                                option.value === value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    disabled={option.disabled}
                                    onClick={() =>
                                        handleSelect(option)
                                    }
                                    className={[
                                        "flex w-full items-center justify-between gap-3",
                                        "px-3 py-2 text-left text-sm",
                                        "text-slate-900 transition-colors duration-100",
                                        "hover:bg-slate-100",
                                        "focus:bg-slate-100 focus:outline-none",
                                        selected
                                            ? "bg-emerald-50 text-emerald-900"
                                            : "",
                                        option.disabled
                                            ? "cursor-not-allowed opacity-45"
                                            : "",
                                        "dark:text-slate-100",
                                        "dark:hover:bg-slate-800",
                                        "dark:focus:bg-slate-800",
                                        selected
                                            ? "dark:bg-emerald-950/50 dark:text-emerald-100"
                                            : "",
                                    ].join(" ")}
                                >
                                    <span className="truncate">
                                        {option.label}
                                    </span>

                                    {selected && (
                                        <Check
                                            className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400"
                                            aria-hidden="true"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}