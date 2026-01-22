import { sql } from "@/lib/neon";
import { StandardResponse } from "@/lib/types";
import type { Permission, User } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { getInitialFromLineId } from "@/api-controller/assistant/assistant";
import { replyMessage } from "@/api-controller/line/send";
import { getAttendanceData } from "@/api-controller/teaching/teaching";

export async function getAllPermissions(
    user: User
): Promise<StandardResponse<Permission[]>> {
    try {
        const query =
            user.role !== "ADMIN"
                ? sql`SELECT *
                        FROM permissions p
                        JOIN shifts s ON s."ShiftId" = p.shift_id
                    WHERE initial = ${user.username}`
                : sql`SELECT * 
                        FROM permissions p
                        JOIN shifts s ON s."ShiftId" = p.shift_id`;
        const permissions = await sql`${query}`;

        const mapped = permissions.map((p) => ({
            ...p,
            shift: {
                ShiftId: p.ShiftId ?? "UNKNOWN",
                Start: p.Start ?? "UNKNOWN",
                End: p.End ?? "UNKNOWN",
            },
        })) as Permission[];

        return {
            success: true,
            message: "All permissions fetched successfully.",
            data: mapped,
        };
    } catch (error) {
        console.error("Error fetching pending permissions:", error);
        return {
            success: false,
            message: "Failed to fetch pending permissions.",
        };
    }
}

export async function getPermissionByStatus(
    status: string,
    user: User
): Promise<StandardResponse<Permission[]>> {
    try {
        const query =
            user.role !== "ADMIN"
                ? sql`SELECT * FROM permissions p
                        JOIN shifts s ON s."ShiftId" = p.shift_id WHERE status = ${status} AND initial = ${user.username}`
                : sql`SELECT * FROM permissions p
                        JOIN shifts s ON s."ShiftId" = p.shift_id WHERE status = ${status}`;

        const permissions = await sql`${query}`;

        const mapped = permissions.map((p) => ({
            ...p,
            shift: {
                ShiftId: p.ShiftId ?? "UNKNOWN",
                Start: p.Start ?? "UNKNOWN",
                End: p.End ?? "UNKNOWN",
            },
        })) as Permission[];

        return {
            success: true,
            message: `${status} permissions fetched successfully.`,
            data: mapped,
        };
    } catch (error) {
        console.error(`Error fetching ${status} permissions:`, error);
        return {
            success: false,
            message: "Failed to fetch pending permissions.",
        };
    }
}

export async function approvePermission(
    id: string,
    reason?: string
): Promise<StandardResponse<null>> {
    try {
        const result = await sql`
            UPDATE permissions
            SET 
                status = 'approved',
                status_reason = ${reason ?? null}
            WHERE id = ${id}
            RETURNING id
        `;

        if (result.length === 0) {
            return {
                success: false,
                message: "No permission found with the given ID.",
            };
        }

        return {
            success: true,
            message: "Permission approved successfully.",
        };
    } catch (error) {
        console.error("Error approving permission:", error);
        return {
            success: false,
            message: "Failed to approve permission.",
        };
    }
}

export async function rejectPermission(
    id: string,
    reason: string
): Promise<StandardResponse<null>> {
    try {
        if (!reason || reason.trim() === "") {
            return {
                success: false,
                message: "Rejection reason cannot be empty.",
            };
        }

        const result = await sql`
            UPDATE permissions
            SET 
                status = 'rejected',
                status_reason = ${reason}
            WHERE id = ${id}
            RETURNING id
        `;

        if (result.length === 0) {
            return {
                success: false,
                message: "No permission found with the given ID.",
            };
        }

        return {
            success: true,
            message: "Permission rejected successfully.",
        };
    } catch (error) {
        console.error("Error rejecting permission:", error);
        return {
            success: false,
            message: "Failed to reject permission.",
        };
    }
}

export async function createPermission(payload: {
    replyToken: string;
    source: { userId: string; groupId?: string };
    message: { text: string };
}): Promise<StandardResponse<Permission>> {
    try {
        const getInitialResponse = await getInitialFromLineId(
            payload.source.userId
        );
        const reason = payload.message.text.split(" ")[1] || null;

        if (!getInitialResponse.success || !getInitialResponse.data) {
            replyMessage(
                payload.replyToken,
                "You need to link your Line account to an assistant account before requesting permission."
            );
            return {
                success: false,
                message: "Line account not linked to any assistant account.",
            };
        }

        if (!reason) {
            replyMessage(
                payload.replyToken,
                "Please provide a reason for the permission request."
            );
            return {
                success: false,
                message: "Please provide a reason for the permission request.",
            };
        }

        const initial = getInitialResponse.data;
        const attendanceRawData = await getAttendanceData();

        const shift_id = attendanceRawData.shift?.ShiftId || null;

        let transaction = null;

        for (const attendance of attendanceRawData.attendance) {
            for (const lect of attendance.Lecturers) {
                const target =
                    lect.First.Status === "Substituted" ||
                    lect.First.Status === "Permission" ||
                    lect.First.Status === "SpecialPermission"
                        ? lect.Next
                        : lect.First;
                if (target.UserName === initial) {
                    transaction = {
                        classCode: attendance.ClassName,
                        room: attendance.Room,
                        course: attendance.CourseName,
                    };
                    break;
                }
            }
        }

        if (!transaction) {
            replyMessage(
                payload.replyToken,
                "No teaching schedule found for you in the current shift."
            );
            return {
                success: false,
                message:
                    "No teaching schedule found for you in the current shift.",
            };
        }

        const new_id = uuidv4();

        const rows = (await sql`
            INSERT INTO permissions (
                id,
                initial,
                reason,
                class,
                room,
                course,
                shift_id,
                status,
                status_reason
            )
            VALUES (
                ${new_id},
                ${initial},
                ${reason},
                ${transaction.classCode},
                ${transaction.room},
                ${transaction.course},
                ${shift_id},
                'pending',
                NULL
            )
            RETURNING id
        `) as Permission[];

        if (rows.length === 0) {
            return {
                success: false,
                message: "Unknown Error - Failed to create permission.",
            };
        }

        return {
            success: true,
            message: "Permission created successfully.",
            data: rows[0],
        };
    } catch (error) {
        console.error("Error creating permission:", error);
        return {
            success: false,
            message: "Failed to create permission.",
        };
    }
}
