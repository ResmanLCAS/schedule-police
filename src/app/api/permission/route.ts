import { NextRequest } from "next/server";
import {
    approvePermission,
    rejectPermission,
    getPermissionByStatus,
    getAllPermissions,
} from "@/api-controller/permission/permission";
import { AUTH_COOKIE_NAME } from "@/api-controller/auth/auth";
import { errorResponse, StandardResponse, successResponse } from "@/lib/types";
import { verifyToken } from "@/api-controller/auth/jwt";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
        return errorResponse("No token found.", 401);
    }

    const payload = verifyToken(token);

    if (!payload.success || !payload.data) {
        return errorResponse(payload.message, 401);
    }

    const user = payload.data;

    let result;

    switch (type) {
        case "pending":
            result = await getPermissionByStatus("pending", user);
            break;

        case "approved":
            result = await getPermissionByStatus("approved", user);
            break;

        case "rejected":
            result = await getPermissionByStatus("rejected", user);
            break;

        default:
            result = await getAllPermissions(user);
            break;
    }

    if (!result.success) return errorResponse(result.message, 500);
    return successResponse(result.message, result.data);
}

export async function PATCH(request: NextRequest) {
    const body = await request.json();
    const { action, id, reason } = body;

    let result: StandardResponse<null>;

    switch (action) {
        case "approve":
            result = await approvePermission(id, reason);
            break;

        case "reject":
            result = await rejectPermission(id, reason);
            break;

        default:
            result = {
                success: false,
                message: "Invalid action.",
            };
    }

    if (!result.success) return errorResponse(result.message, 500);
    return successResponse(result.message, result.data);
}
