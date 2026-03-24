"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginPageProps = {
    nextUrl?: string;
};

function LoginForm({ nextUrl }: LoginPageProps) {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const next = nextUrl || "/planner";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/planner/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json?.error || "Unable to sign in");
                return;
            }

            router.replace(next);
            router.refresh();
        } catch {
            setError("Unable to sign in");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 px-6 py-10 dark:bg-slate-950">
            <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
                <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-8">
                        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-bold text-white shadow-lg">
                            CP
                        </div>
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                            Sign in to Clinic Planner
                        </h1>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Use your planner account to access schedules and editing tools.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        {error ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                                {error}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? "Signing in..." : "Sign in"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}

export default function LoginPage({
                                      searchParams,
                                  }: {
    searchParams?: { next?: string };
}) {
    return <LoginForm nextUrl={searchParams?.next} />;
}