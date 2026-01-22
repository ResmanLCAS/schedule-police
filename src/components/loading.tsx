"use client";

import { ModeToggle } from "@/components/theme-toggle";

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div
                role="status"
                aria-live="polite"
                className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-transparent border-t-blue-400 text-4xl text-blue-400">
                    <div className="flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-transparent border-t-red-400 text-2xl text-red-400"></div>
                </div>
                <p className="text-sm text-center text-foreground">
                    Checking authentication state...
                </p>
            </div>
            <div className="absolute bottom-4 right-4">
                <ModeToggle />
            </div>
        </div>
    );
}
