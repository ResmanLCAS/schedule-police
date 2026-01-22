"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { StandardResponse, User } from "@/lib/types";

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    login: (
        username: string,
        password: string
    ) => Promise<StandardResponse<User>>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    login: () =>
        Promise.resolve({ success: false, message: "Not implemented" }),
    logout: () => Promise.resolve(),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const verifyResponse = await fetch("/api/auth/verify");

            if (verifyResponse.ok) {
                const responseJson: StandardResponse<User> =
                    await verifyResponse.json();
                if (responseJson.success && responseJson.data) {
                    setUser(responseJson.data);
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (
        username: string,
        password: string
    ): Promise<StandardResponse<User>> => {
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                credentials: "include",
                body: new URLSearchParams({
                    username: username.toUpperCase(),
                    password,
                }).toString(),
            });

            const loginResponse = await response.json();

            if (loginResponse.success) {
                await checkAuth();
            }

            return loginResponse;
        } catch (error) {
            return {
                success: false,
                message:
                    error instanceof Error ? error.message : "Login failed",
            };
        }
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    return useContext(AuthContext);
}
