"use client";

import { useEffect, useState, useCallback } from "react";

import Loading from "@/components/loading";
import Navbar from "@/components/navbar";
import { PermissionCard } from "@/components/permission-card";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Button } from "@/components/ui/button";
import type { Permission } from "@/lib/types";
import { toast } from "sonner";

type PermissionFilter = "pending" | "approved" | "rejected" | null;

export default function Page() {
    const { user, loading } = useAuthGuard({ requireAuth: true });

    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [filter, setFilter] = useState<PermissionFilter>(null);
    const [isFetching, setIsFetching] = useState(false);

    const fetchPermissions = useCallback(async () => {
        if (!user) return;

        setIsFetching(true);
        try {
            const url =
                filter === null
                    ? "/api/permission"
                    : `/api/permission?type=${filter}`;

            const res = await fetch(url, { credentials: "include" });
            const json = await res.json();

            if (json.success) {
                setPermissions(json.data);
            }
        } catch (err) {
            toast.error("Failed to fetch permissions.");
            console.error("Failed to fetch permissions:", err);
        } finally {
            setIsFetching(false);
        }
    }, [user, filter]);

    useEffect(() => {
        if (!user) return;
        fetchPermissions();
    }, [user, fetchPermissions]);

    if (loading) return <Loading />;

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="max-w-7xl mx-auto p-6 space-y-8">
                <div className="flex justify-center gap-2 flex-wrap">
                    <Button
                        variant={filter === null ? "default" : "outline"}
                        onClick={() => setFilter(null)}>
                        All
                    </Button>

                    <Button
                        variant={filter === "pending" ? "default" : "outline"}
                        onClick={() => setFilter("pending")}>
                        Pending
                    </Button>

                    <Button
                        variant={filter === "approved" ? "default" : "outline"}
                        onClick={() => setFilter("approved")}>
                        Approved
                    </Button>

                    <Button
                        variant={filter === "rejected" ? "default" : "outline"}
                        onClick={() => setFilter("rejected")}>
                        Rejected
                    </Button>
                </div>

                {isFetching ? (
                    <div className="flex justify-center py-20">
                        <Loading />
                    </div>
                ) : permissions.length > 0 ? (
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {permissions.map((p) => (
                            <PermissionCard
                                key={p.id}
                                permission={p}
                                onApprove={async (id) => {
                                    await fetch("/api/permission", {
                                        method: "PATCH",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                            action: "approve",
                                            id,
                                        }),
                                    });
                                    fetchPermissions();
                                }}
                                onReject={async (id, reason) => {
                                    await fetch("/api/permission", {
                                        method: "PATCH",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                            action: "reject",
                                            id,
                                            reason,
                                        }),
                                    });
                                    fetchPermissions();
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center text-center py-20">
                        <h1 className="text-xl font-medium">
                            No {filter} permissions
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            You&apos;re all caught up!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
