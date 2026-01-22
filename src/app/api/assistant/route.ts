import { NextRequest } from "next/server";
import {
    getAllAssistants,
    updateRole,
} from "@/api-controller/assistant/assistant";
import { errorResponse, successResponse } from "@/lib/types";
import { AUTH_COOKIE_NAME } from "@/api-controller/auth/auth";
import { verifyToken } from "@/api-controller/auth/jwt";

export async function GET(request: NextRequest) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
        return errorResponse("No token found.", 401);
    }

    const payload = verifyToken(token);

    if (!payload.success || !payload.data) {
        return errorResponse(payload.message, 401);
    } else if (payload.data.role !== "ADMIN") {
        return errorResponse("Unauthorized.", 403);
    }

    const result = await getAllAssistants();

    return successResponse("Assistants fetched successfully.", result.data);
}

export async function PATCH(request: NextRequest) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
        return errorResponse("No token found.", 401);
    }

    const payload = verifyToken(token);

    if (!payload.success || !payload.data) {
        return errorResponse(payload.message, 401);
    }

    const { initial, role } = await request.json();

    if (!initial || !role) {
        return errorResponse("initial and role are required.", 400);
    }

    const result = await updateRole(initial, role);

    return result.success
        ? successResponse(result.message)
        : errorResponse(result.message, 500);
}
