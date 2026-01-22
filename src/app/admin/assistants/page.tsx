"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import Loading from "@/components/loading";
import Navbar from "@/components/navbar";
import { AssistantCard } from "@/components/assistant-card";
import { Button } from "@/components/ui/button";
import type { Assistant } from "@/lib/types";
import { toast } from "sonner";

type RoleFilter = "ALL" | "ADMIN" | "AST";

export default function AssistantsPage() {
    const { user, loading } = useAuthGuard({ requireAuth: true });

    const [assistants, setAssistants] = useState<Assistant[]>([]);
    const [isFetching, setFetching] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

    const fetchAssistants = useCallback(async () => {
        setFetching(true);
        try {
            const res = await fetch("/api/assistant", {
                method: "GET",
                credentials: "include",
            });
            const json = await res.json();

            if (json.success) {
                setAssistants(json.data);
            }
        } catch (err) {
            toast.error("Failed to fetch assistants.");
            console.error("Failed to fetch assistants:", err);
        } finally {
            setFetching(false);
        }
    }, []);

    useEffect(() => {
        if (user?.role === "ADMIN") {
            fetchAssistants();
        } else {
            setFetching(false);
        }
    }, [user, fetchAssistants]);

    const handleRoleChange = async (initial: string, newRole: string) => {
        try {
            toast.info(`Updating ${initial}'s role to ${newRole}...`);
            const res = await fetch("/api/assistant", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ initial, role: newRole }),
            });
            const json = await res.json();

            if (!json.success) {
                throw new Error(json.message);
            }

            setAssistants((prev) =>
                prev.map((a) =>
                    a.initial === initial ? { ...a, role: newRole } : a
                )
            );

            toast.success(
                `Successfully updated ${initial}'s role to ${newRole}.`
            );
        } catch (err) {
            console.error("Failed to update role:", err);
            toast.error("Failed to update role.");
            fetchAssistants();
        }
    };

    const filteredAssistants = useMemo(() => {
        const q = search.toLowerCase();

        return assistants.filter((a) => {
            const matchesSearch = a.initial.toLowerCase().includes(q);

            const matchesRole = roleFilter === "ALL" || a.role === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [assistants, search, roleFilter]);

    if (loading) return <Loading />;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-5xl mx-auto p-8 space-y-8">
                <header className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Assistants
                    </h1>
                    <p className="text-muted-foreground">
                        Manage Assistant Roles.
                    </p>
                </header>

                <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                    <input
                        type="text"
                        placeholder="Search by initial..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="
                            w-full md:w-80
                            rounded-lg
                            bg-background border border-border
                            px-4 py-2 text-sm
                            text-foreground
                            placeholder:text-muted-foreground
                            focus:outline-none focus:ring-2 focus:ring-primary
                        "
                    />

                    <div className="flex gap-2">
                        <Button
                            variant={
                                roleFilter === "ALL" ? "default" : "outline"
                            }
                            onClick={() => setRoleFilter("ALL")}>
                            All
                        </Button>
                        <Button
                            variant={
                                roleFilter === "ADMIN" ? "default" : "outline"
                            }
                            onClick={() => setRoleFilter("ADMIN")}>
                            Admins
                        </Button>
                        <Button
                            variant={
                                roleFilter === "AST" ? "default" : "outline"
                            }
                            onClick={() => setRoleFilter("AST")}>
                            Assistants
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isFetching ? (
                        <div className="flex justify-center py-20">
                            <Loading />
                        </div>
                    ) : filteredAssistants.length > 0 ? (
                        filteredAssistants.map((assistant) => (
                            <AssistantCard
                                key={assistant.initial}
                                assistant={assistant}
                                onRoleChange={(newRole) =>
                                    handleRoleChange(assistant.initial, newRole)
                                }
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center text-muted-foreground py-12">
                            No assistants match your filters.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
