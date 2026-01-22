import { notifyTeachingSchedule } from "@/api-controller/teaching/teaching";
import { errorResponse, successResponse } from "@/lib/types";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    const token = request.headers.get("X-Auth-Token");

    if (token !== process.env.X_AUTH_SECRET) {
        return errorResponse("Unauthorized.", 401);
    }

    const response = await notifyTeachingSchedule();
    if (!response.success) return errorResponse(response.message, 500);
    else return successResponse(response.message);
}
