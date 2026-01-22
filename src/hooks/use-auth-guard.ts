"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

interface UseAuthGuardOptions {
    requireAuth: boolean;
    redirectTo?: string;
}

export function useAuthGuard(options: UseAuthGuardOptions) {
    const { user, loading } = useAuth();
    const router = useRouter();

    const { requireAuth, redirectTo = requireAuth ? "/login" : "/home" } =
        options;

    useEffect(() => {
        if (loading) return;

        const isAuthenticated = user !== null;

        if (requireAuth && !isAuthenticated) {
            router.push(redirectTo);
        } else if (!requireAuth && isAuthenticated) {
            router.push(redirectTo);
        }
    }, [user, loading, requireAuth, redirectTo, router]);

    return { user, loading };
}
