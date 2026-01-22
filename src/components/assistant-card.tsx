"use client";

import type { AssistantCardProps } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AssistantCard({ assistant, onRoleChange }: AssistantCardProps) {
    const isAdmin = assistant.role.toUpperCase() === "ADMIN";

    const handleToggle = () => {
        onRoleChange(isAdmin ? "AST" : "ADMIN");
    };

    return (
        <Card
            className="
                p-6
                flex items-center justify-between flex-nowrap
                transition-all
                dark:bg-zinc-950 dark:border-zinc-800 dark:hover:border-zinc-700
                bg-white border-zinc-200 hover:border-zinc-300
            ">
            <div className="flex items-center gap-4 min-w-0">
                <div
                    className="
                        w-12 h-12 shrink-0 rounded-full
                        flex items-center justify-center
                        font-medium uppercase transition-colors
             
                        bg-zinc-100 border border-zinc-300 text-zinc-700
                
                        dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400
                        dark:group-hover:border-zinc-700
                    ">
                    {assistant.initial.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex flex-col gap-1">
                    <h3 className="font-medium tracking-tight truncate text-zinc-900 dark:text-zinc-100">
                        {assistant.initial}
                    </h3>
                    <p className="text-sm capitalize truncate text-zinc-600 dark:text-zinc-500">
                        {assistant.role}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                <span
                    className={cn(
                        "text-[10px] font-bold tracking-widest uppercase transition-colors text-zinc-500"
                    )}>
                    AST
                </span>

                <button
                    onClick={handleToggle}
                    aria-label="Toggle Role"
                    className={cn(
                        "relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
                        isAdmin
                            ? "bg-purple-600 shadow-[0_0_15px_-3px_rgba(147,51,234,0.5)]"
                            : "bg-gray-600 dark:bg-gray -500"
                    )}>
                    <span
                        className={cn(
                            "inline-block h-5 w-5 rounded-full bg-white transition-transform duration-300 shadow-sm",
                            isAdmin ? "translate-x-8" : "translate-x-1"
                        )}
                    />
                </button>

                <span
                    className={cn(
                        "text-[10px] font-bold tracking-widest uppercase transition-colors",
                        isAdmin ? "text-purple-600" : "text-zinc-500"
                    )}>
                    ADMIN
                </span>
            </div>
        </Card>
    );
}
