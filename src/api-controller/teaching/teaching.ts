import {
    Attendance,
    RegionMap,
    Shift,
    ShiftWithDate,
    StandardResponse,
} from "@/lib/types";
import { lineMessagingApiClient } from "@/lib/line";
import { sql } from "@/lib/neon";
import {
    replyMessage,
    sendTeachingAttendanceByReply,
    sendTeachingReminderToGroup,
} from "@/api-controller/line/send";
import {
    getNonPresentLecturersByRegion,
    getNotificationMessages,
    parseTimeToToday,
} from "@/api-controller/teaching/helper";

async function getCurrentShift(nowDate: Date): Promise<ShiftWithDate | null> {
    const shifts = await fetch(
        "https://bluejack.binus.ac.id/lapi/api/Lecturer/GetShifts",
        {
            method: "GET",
            headers: {
                "X-Recsel-Secret": process.env.SLC_X_RECSEL_SECRET!,
            },
        }
    );

    const shiftsData = await shifts.json();

    const shiftsWithDate: ShiftWithDate[] = shiftsData.map((s: Shift) => ({
        ...s,
        startDate: parseTimeToToday(s.Start),
    }));

    const futureShifts = shiftsWithDate.filter(
        (s) => s.startDate.getTime() > nowDate.getTime()
    );

    if (futureShifts.length === 0) return null;

    futureShifts.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return futureShifts[0];
}

export async function getAttendanceData(): Promise<{
    attendance: Attendance[];
    shift: ShiftWithDate | null;
}> {
    const nowDate = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );
    const transactionDate = nowDate.toISOString().split("T")[0];

    const closestShift = await getCurrentShift(nowDate);
    const closestShiftId = closestShift ? closestShift.ShiftId : null;

    if (!closestShiftId) {
        console.warn("No upcoming shifts found.");
        return {
            attendance: [],
            shift: null,
        };
    }

    const attendance = await fetch(
        `https://bluejack.binus.ac.id/lapi/api/Lecturer/GetLecturerAttendanceByLaboratoryId?transactionDate=${transactionDate}&shiftId=${closestShiftId}&labId=f5bbcbf8-7faa-df11-bca3-d8d385fce79c`,
        {
            method: "GET",
            headers: {
                "X-Recsel-Secret": process.env.SLC_X_RECSEL_SECRET!,
            },
        }
    );

    const attendanceRawData = await attendance.json();
    return {
        attendance: attendanceRawData.RoomAttendance ?? [],
        shift: closestShift,
    };
}

async function notifyAllRegions(
    activeRegionKeys: Record<string, string>[],
    nonPresentLecturersByRegion: RegionMap
) {
    for (const row of activeRegionKeys) {
        if (nonPresentLecturersByRegion[row.region]?.length === 0) {
            console.log(`All ${row.region} lecturers are present.`);
            continue;
        }
        const groupIdReq =
            await sql`SELECT * FROM active_regions WHERE region = ${row.region} `;

        if (groupIdReq.length === 0) {
            console.error(`No group ID found for region: ${row.region}`);
            continue;
        }

        const groupId = groupIdReq[0];

        const messages = await getNotificationMessages(
            nonPresentLecturersByRegion[row.region]
        );

        const sendMessageResponse = await sendTeachingReminderToGroup(
            messages,
            groupId.remind_group_line_id
        );
        if (!sendMessageResponse.success) {
            console.error(
                `Failed to send notification message: ${sendMessageResponse.message}`
            );
            lineMessagingApiClient.pushMessage({
                to: groupId.op_group_line_id,
                messages: [
                    {
                        type: "text",
                        text: `Dear OP Officers, \n\nAn error occured while checking attendance data.\n\nPlease check attendance transaction immediately.\n\nThank you.`,
                    },
                ],
            });
        }
        continue;
    }
}

async function notifyByReply(
    replyToken: string,
    groupId: string,
    nonPresentLecturersByRegion: RegionMap
) {
    console.log(nonPresentLecturersByRegion);
    const region =
        await sql`SELECT region FROM active_regions WHERE remind_group_line_id = ${groupId}`;
    if (region.length === 0) {
        console.error(`No region found for group ID: ${groupId}`);
        replyMessage(
            replyToken,
            `This group isn't registered as a reminder group.`
        );
        return {
            success: false,
            message: `No region found for group ID: ${groupId}`,
        };
    }

    const nonPresentLecturers = nonPresentLecturersByRegion[region[0].region];
    if (!nonPresentLecturers || nonPresentLecturers.length === 0) {
        console.log(`All ${region[0].region} lecturers are present.`);
        replyMessage(replyToken, `All lecturers are present.`);
        return;
    }

    const messages = await getNotificationMessages(nonPresentLecturers);

    if (messages.length === 0) {
        replyMessage(replyToken, `All lecturers are present.`);
    }

    await sendTeachingReminderToGroup(messages, groupId, replyToken);
}

export async function notifyTeachingSchedule(
    type: "push" | "reply" = "push",
    replyToken?: string,
    groupId?: string
): Promise<StandardResponse<void>> {
    try {
        console.log(
            "Starting teaching schedule check...",
            type,
            replyToken,
            groupId
        );

        const activeRegionKeys =
            await sql`SELECT DISTINCT(region) FROM active_regions`;

        if (activeRegionKeys.length === 0) {
            console.warn("No active regions found in the database.");
            return { success: true, message: "No active regions found." };
        }

        const attendanceData = await getAttendanceData();

        if (attendanceData.attendance.length === 0) {
            console.log("No attendance data found for current shift.");
            if (replyToken)
                replyMessage(
                    replyToken,
                    "No attendance data found for current shift."
                );
            return { success: true, message: "No attendance data found." };
        }

        const nonPresentLecturersByRegion = getNonPresentLecturersByRegion(
            attendanceData.attendance
        );

        if (type === "push") {
            await notifyAllRegions(
                activeRegionKeys,
                nonPresentLecturersByRegion
            );
        } else if (replyToken && groupId) {
            await notifyByReply(
                replyToken,
                groupId,
                nonPresentLecturersByRegion
            );
        } else {
            return {
                success: false,
                message: "Reply token is required for reply type.",
            };
        }
        return { success: true, message: "Teaching schedule check completed." };
    } catch (error) {
        console.error("Error in checking teaching schedule:", error);

        return {
            success: false,
            message: `Error checking teaching schedule: ${
                error instanceof Error ? error.message : "Unknown error"
            }`,
        };
    }
}

export async function manualNotifyTeachingSchedule(payloadToProcess: {
    replyToken: string;
    source: { userId: string; groupId?: string };
}): Promise<void> {
    const check =
        await sql`SELECT role FROM assistants WHERE line_id = ${payloadToProcess.source.userId}`;

    if (check.length !== 0 && check[0].role === "ADMIN")
        notifyTeachingSchedule(
            "reply",
            payloadToProcess.replyToken,
            payloadToProcess.source.groupId ?? ""
        );

    // else
    //     await replyMessage(
    //         payloadToProcess.replyToken,
    //         "You do not have permission to use this command."
    //     );
    return;
}

export async function manualCheckTeachingSchedule(payloadToProcess: {
    replyToken: string;
    source: { userId: string; groupId?: string };
    message: { text: string };
}): Promise<void> {
    const check =
        await sql`SELECT role FROM assistants WHERE line_id = ${payloadToProcess.source.userId}`;
    if (check.length !== 0 && check[0].role === "ADMIN") {
        const region = payloadToProcess.message.text.split(" ")[1] ?? "ALL";

        const attendanceRawData = await getAttendanceData();
        if (region !== "ALL") {
            const filteredAttendance = attendanceRawData.attendance.filter(
                (att) => att.CampusName === region
            );
            attendanceRawData.attendance = filteredAttendance;
        }

        sendTeachingAttendanceByReply(
            payloadToProcess.replyToken,
            attendanceRawData.attendance,
            attendanceRawData.shift,
            region
        );
    }
}
