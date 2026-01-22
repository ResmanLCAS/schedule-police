"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Permission } from "@/lib/types";

interface PermissionCardProps {
    permission: Permission;
    onApprove?: (id: string) => void;
    onReject?: (id: string, reason: string) => void;
}

export function PermissionCard({
    permission,
    onApprove,
    onReject,
}: PermissionCardProps) {
    const isPending = permission.status === "pending";

    const [showRejectionForm, setShowRejectionForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    const getInitials = (name: string) =>
        name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

    const statusBadge = {
        pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
        approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        rejected: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    }[permission.status ?? "pending"];

    return (
        <Card className="relative overflow-hidden border-white/20 bg-white/10 backdrop-blur-md dark:bg-black/20">
            <div className="relative p-5 space-y-4">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-tr from-blue-500 to-indigo-600 text-white font-bold">
                        {getInitials(permission.initial)}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg truncate">
                                {permission.initial}
                            </h3>
                            <span
                                className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full border ${statusBadge}`}>
                                {permission.status}
                            </span>
                        </div>

                        <p className="text-sm text-muted-foreground italic mt-1">
                            “{permission.reason}”
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[12px] text-muted-foreground">
                    <div className="bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                        📅{" "}
                        {new Date(permission.created_at).toLocaleDateString()}
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                        🕒 {permission.shift.Start} - {permission.shift.End}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[12px] text-muted-foreground">
                    <div className="bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                        📑 {permission.course}
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                        📍 Room {permission.room}
                    </div>
                </div>

                {permission.status === "rejected" &&
                    permission.status_reason && (
                        <div className="text-sm p-3 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            <strong>Rejection reason:</strong>{" "}
                            {permission.status_reason}
                        </div>
                    )}

                {isPending && !showRejectionForm && (
                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={() => onApprove?.(permission.id)}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white">
                            Approve
                        </Button>
                        <Button
                            onClick={() => setShowRejectionForm(true)}
                            variant="outline"
                            className="flex-1 border-rose-500 text-rose-500">
                            Reject
                        </Button>
                    </div>
                )}

                {isPending && showRejectionForm && (
                    <div className="space-y-3">
                        <textarea
                            placeholder="Enter rejection reason..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full min-h-20 text-sm p-3 rounded-xl bg-black/5 dark:bg-white/5"
                        />
                        <div className="flex gap-2">
                            <Button
                                onClick={() =>
                                    onReject?.(permission.id, rejectionReason)
                                }
                                disabled={!rejectionReason.trim()}
                                className="flex-1 bg-rose-500 text-white">
                                Submit Reject
                            </Button>
                            <Button
                                onClick={() => setShowRejectionForm(false)}
                                variant="ghost">
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
