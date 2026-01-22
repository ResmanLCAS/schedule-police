import { StandardResponse } from "@/lib/types";

import crypto from "crypto";

export function verifyLineSignature(
    payload: string,
    signature: string
): StandardResponse<boolean> {
    try {
        const secret = process.env.LINE_CHANNEL_SECRET!;

        const hmac = crypto
            .createHmac("sha256", secret)
            .update(payload, "utf8")
            .digest("base64");
        return {
            success: true,
            message: "Signature verification completed.",
            data: hmac === signature,
        };
    } catch (error) {
        console.error("Error during signature verification:", error);
        return {
            success: false,
            message: "An error occurred during signature verification.",
            data: false,
        };
    }
}
