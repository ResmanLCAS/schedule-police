import { refreshShifts } from "@/api-controller/admin/shift";
import { AUTH_COOKIE_NAME } from "@/api-controller/auth/auth";
import { verifyToken } from "@/api-controller/auth/jwt";
import { errorResponse, successResponse } from "@/lib/types";
import { NextRequest } from "next/server";

export async function PUT(request: NextRequest) {
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

    const refreshShiftResponse = await refreshShifts();

    if (!refreshShiftResponse.success)
        return errorResponse(refreshShiftResponse.message, 500);
    return successResponse(refreshShiftResponse.message);
}
