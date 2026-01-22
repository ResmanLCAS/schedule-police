import { NextRequest } from "next/server";
import { successResponse, errorResponse, User } from "@/lib/types";
import { verifyToken } from "@/api-controller/auth/jwt";
import { AUTH_COOKIE_NAME } from "@/api-controller/auth/auth";

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

        if (!token) {
            return errorResponse("No token found.", 401);
        }

        const payload = verifyToken(token);

        if (!payload.success || !payload.data) {
            return errorResponse(payload.message, 401);
        }

        return successResponse<User>("User authenticated.", payload.data);
    } catch (error) {
        console.error("Auth verification error:", error);
        return errorResponse("Internal server error", 500);
    }
}
