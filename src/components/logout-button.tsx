"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
    className?: string;
    redirectTo?: string;
    children?: React.ReactNode;
    onLogoutSuccess?: () => void;
}

export function LogoutButton({
    className = "hover:cursor-pointer",
    redirectTo = "/login",
    children = "Logout",
    onLogoutSuccess,
}: LogoutButtonProps) {
    const { logout } = useAuth();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);
        try {
            await logout();
            onLogoutSuccess?.();
            router.push(redirectTo);
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={className}
            variant={"destructive"}
            type="button">
            {isLoggingOut ? "Logging out..." : children}
        </Button>
    );
}
