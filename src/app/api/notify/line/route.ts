import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/types";
import { verifyLineSignature } from "@/api-controller/line/verify";
import { HandleConnectRequest } from "@/api-controller/assistant/connect";
import {
    manualNotifyTeachingSchedule,
    manualCheckTeachingSchedule,
} from "@/api-controller/teaching/teaching";
import { createPermission } from "@/api-controller/permission/permission";
import { replyMessage } from "@/api-controller/line/send";
import { sign } from "crypto";

const HelpMessage = `Available Commands:

/checkmessier [region] - Display current teaching schedule.
/notifymessier - Display & notify current teaching schedule.
/latepermission [reason] - Request permission for being late.

To connect your line account, visit https://schedule-police.vercel.app and follow the instructions.`;

export async function POST(request: NextRequest) {
    console.log("Hit");
    const body = await request.text();
    const signature = request.headers.get("x-line-signature");

    const valid = verifyLineSignature(body, signature || "");
    if (!valid.success || !valid.data) {
        return errorResponse("Invalid signature", 401);
    }

    console.log("Signature");

    const rawPayload = JSON.parse(body);

    const payloadToProcess = rawPayload.events[0];

    console.log(payloadToProcess)

    if (!payloadToProcess) {
        return successResponse("Message received.", null);
    }

    switch (payloadToProcess.type) {
        case "message":
            const text = payloadToProcess.message.text;
            if (text === "/help") {
                await replyMessage(payloadToProcess.replyToken, HelpMessage);
            } else if (text.startsWith("CONNECT_LINE_ID-")) {
                await HandleConnectRequest(payloadToProcess);
                break;
            } else if (text === "/notifymessier") {
                await manualNotifyTeachingSchedule(payloadToProcess);
                break;
            } else if (text.startsWith("/checkmessier")) {
                await manualCheckTeachingSchedule(payloadToProcess);
            } else if (text.startsWith("/acceptpermission")) {
                // await manualCheckTeachingSchedule(payloadToProcess);
            } else if (text.startsWith("/latepermission")) {
                await createPermission(payloadToProcess);
            } else {
                console.log("Received unknown message:", payloadToProcess);
                break;
            }
            break;

        default:
            console.log("Unhandled event type:", payloadToProcess);
            break;
    }

    return successResponse("Message received.", null);
}
