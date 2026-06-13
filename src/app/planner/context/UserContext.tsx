"use client"

import {createContext, useContext, useState} from "react";


export type PlannerUser = {
    id?: number;
    full_name: string;
    email: string;
    job_role?: string;
    role?: string;
    profile_image_url?: string | null;
};

type UserContextValue = {
    user: PlannerUser | null;
    setUser: (user: PlannerUser | null) => void;
};

const UserContext = createContext<UserContextValue | undefined>(undefined)

export function UserProvider({
    children,
    initialUser = null,
                             }: {
    children: React.ReactNode;
    initialUser?: PlannerUser | null;
}) {
    const [user, setUser] = useState<PlannerUser | null>(initialUser);

    return (
        <UserContext.Provider value={{user, setUser}}>
            {children}
        </UserContext.Provider>
    );
}

export function usePlannerUser() {
    const context = useContext(UserContext);

    if (!context) {
        throw new Error("usePlannerUser must be used inside UserProvider");
    }
    return context;
}