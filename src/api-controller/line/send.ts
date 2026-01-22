import {
    lineMessagingApiClient,
    MentionSubstitutionObject,
    Message,
    TextMessageV2,
} from "@/lib/line";
import {
    Attendance,
    NotifyTeachingMessage,
    ShiftWithDate,
    StandardResponse,
} from "@/lib/types";

export async function sendTeachingReminderToGroup(
    messages: NotifyTeachingMessage[],
    groupLineId: string,
    replyToken: string | null = null
): Promise<StandardResponse<void>> {
    try {
        const prefixText =
            "Dear all mentioned assistants, this is a reminder to re-login onto messier and scan BinusMaya Attendance QR Code.\n\n";

        const suffixText = "\n\nThank you.";

        const textTemplateParts: string[] = [];
        const substitutionObjects: Record<string, MentionSubstitutionObject> =
            {};

        messages.forEach((msg, index) => {
            const idx = index + 1;
            const userId = msg.userId;
            const text = msg.text ?? "";
            const mention = msg.mention;

            if (!userId) return;

            if (mention) {
                const placeholder = `user${idx}`;

                textTemplateParts.push(`${idx}. {${placeholder}} - ${text}`);

                substitutionObjects[placeholder] = {
                    type: "mention",
                    mentionee: {
                        type: "user",
                        userId,
                    },
                };
            } else {
                textTemplateParts.push(`${idx}. @${userId} - ${text}`);
            }
        });

        const fullText = prefixText + textTemplateParts.join("\n") + suffixText;

        const lineMessage: TextMessageV2 = {
            type: "textV2",
            text: fullText,
            substitution:
                Object.keys(substitutionObjects).length > 0
                    ? substitutionObjects
                    : undefined,
        };

        if (replyToken) {
            await lineMessagingApiClient.replyMessage({
                replyToken: replyToken,
                messages: [lineMessage],
            });
        } else {
            await lineMessagingApiClient.pushMessage({
                to: groupLineId,
                messages: [lineMessage],
            });
        }
        return {
            success: true,
            message: "Group message sent successfully.",
        };
    } catch (error) {
        console.error("Error sending group message:", error);

        return {
            success: false,
            message: "An error occurred while sending the group message.",
        };
    }
}

export async function sendTeachingAttendanceByReply(
    replyToken: string,
    attendanceData: Attendance[],
    shift: ShiftWithDate | null,
    region: string = "ALL"
) {
    const prefixText = `Current Teaching Attendance - ${region} Region\n\nCurrent Date: ${
        shift?.startDate.toLocaleDateString() ?? "N/A"
    }\nCurrent Shift: ${shift?.Start ?? "N/A"} - ${shift?.End ?? "N/A"}\n\n`;

    if (attendanceData.length === 0) {
        lineMessagingApiClient.replyMessage({
            replyToken: replyToken,
            messages: [
                {
                    type: "text",
                    text: prefixText + "No attendance data available.",
                },
            ],
        });
        return;
    }

    const messages: string[] = attendanceData.map((data, index) => {
        const lecturersStatus = data.Lecturers.map((lect) => {
            const target =
                lect.First.Status === "Substituted" ||
                lect.First.Status === "Permission" ||
                lect.First.Status === "SpecialPermission"
                    ? lect.Next
                    : lect.First;
            return `- ${target.UserName}: ${target.Status}`;
        }).join("\n");

        const text = `${index + 1}. Room: ${data.Room} - ${data.CourseName} - ${
            data.ClassName
        }\n${lecturersStatus}\n`;
        return text;
    });

    const fullText = prefixText + messages.join("\n");

    lineMessagingApiClient.replyMessage({
        replyToken: replyToken,
        messages: [
            {
                type: "text",
                text: fullText,
            },
        ],
    });
}

export function replyMessage(replyToken: string, message: string) {
    lineMessagingApiClient.replyMessage({
        replyToken: replyToken,
        messages: [
            {
                type: "text",
                text: message,
            } as Message,
        ],
    });
}
