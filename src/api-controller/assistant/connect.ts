import { sql } from "@/lib/neon";
import { errorResponse, successResponse } from "@/lib/types";
import { LineWebhookMessagePayload } from "@/api-controller/line/types";
import { replyMessage } from "@/api-controller/line/send";

export async function GetConnectionString(username: string) {
    try {
        const existing =
            await sql`SELECT connection_string, created_at FROM assistant_connect WHERE initial = ${username}`;
        if (existing.length > 0) {
            const row = existing[0];
            if (
                new Date(`${row.created_at}Z`) >
                new Date(Date.now() - 15 * 60 * 1000)
            ) {
                return successResponse(
                    "Connection String obtained successfully!",
                    row.connection_string
                );
            }
        }

        const randomKey = Math.random()
            .toString(36)
            .substring(2, 2 + 64);

        const connectionString = `CONNECT_LINE_ID-${username}-${randomKey}`;

        await sql`INSERT INTO assistant_connect (initial, connection_string) VALUES (${username}, ${connectionString}) ON CONFLICT (initial) DO UPDATE SET connection_string = EXCLUDED.connection_string, created_at = EXCLUDED.created_at`;

        return successResponse(
            "Connection String obtained successfully!",
            connectionString
        );
    } catch (error) {
        console.error("Error in GetConnectionString:", error);
        return errorResponse("Failed to obtain Connection String.");
    }
}

export async function HandleConnectRequest(
    webhook_payload: LineWebhookMessagePayload
) {
    const connectionString = webhook_payload.message.text;
    const replyToken = webhook_payload.replyToken;

    try {
        const checkResult =
            await sql`SELECT line_id FROM assistants WHERE line_id = ${webhook_payload.source.userId}`;

        if (checkResult.length > 0) {
            replyMessage(
                replyToken,
                "This Line account is already linked to an assistant account."
            );
            return;
        }

        const result =
            await sql`SELECT initial, created_at FROM assistant_connect WHERE connection_string = ${connectionString}`;

        if (result.length === 0) {
            replyMessage(
                replyToken,
                "Invalid connection string. Please ensure you have entered it correctly."
            );
            return;
        }

        const row = result[0];

        if (
            new Date(`${row.created_at}Z`) >
            new Date(Date.now() + 15 * 60 * 1000)
        ) {
            console.log("Connection string has expired.");
            replyMessage(
                replyToken,
                "The connection string has expired. Please generate a new one from https://schedule-police.nathabuddhi.com"
            );
            return;
        }

        const userInitial = row.initial;
        await sql`UPDATE assistants SET line_id = ${webhook_payload.source.userId} WHERE initial = ${userInitial}`;
        await sql`DELETE FROM assistant_connect WHERE initial = ${userInitial}`;

        replyMessage(
            replyToken,
            "Your Line account has been successfully linked!"
        );
        return;
    } catch (error) {
        console.error("Error in HandleConnectRequest:", error);
    }
}
