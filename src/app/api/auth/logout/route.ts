import { successResponse } from "@/lib/types";
import { AUTH_COOKIE_NAME } from "@/api-controller/auth/auth";

export async function POST() {
    const response = successResponse("Logged out successfully", null);

    response.cookies.set(AUTH_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0,
        path: "/",
    });

    return response;
}
