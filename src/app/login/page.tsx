import LoginForm from "./LoginForm";

type PageProps = {
    searchParams?: Promise<{
        next?: string | string[];
    }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
    const sp = searchParams ? await searchParams : undefined;
    const nextUrl = typeof sp?.next === "string" ? sp.next : "/planner";

    return <LoginForm nextUrl={nextUrl} />;
}