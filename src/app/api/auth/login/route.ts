import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/types";
import {
    validateUser,
    AUTH_COOKIE_NAME,
    COOKIE_OPTIONS,
} from "@/api-controller/auth/auth";

export async function POST(request: NextRequest) {
    try {
        const text = await request.text();
        const params = new URLSearchParams(text);
        const username = params.get("username") ?? "";
        const password = params.get("password") ?? "";

        if (!username || !password) {
            return errorResponse("Username and password are required", 400);
        }

        const userValidation = await validateUser(username, password);

        if (!userValidation.success || !userValidation.data) {
            return errorResponse(userValidation.message, 401);
        }

        const response = successResponse(
            "Login successful",
            userValidation.data.user
        );
        response.cookies.set(
            AUTH_COOKIE_NAME,
            userValidation.data.access_token,
            {
                ...COOKIE_OPTIONS,
            }
        );

        return response;
    } catch (error) {
        console.error("Login error:", error);
        return errorResponse("Internal server error", 500);
    }
}
