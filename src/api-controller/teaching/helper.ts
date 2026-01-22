import { sql } from "@/lib/neon";
import { Attendance, NonPresentLecturer, RegionMap } from "@/lib/types";

export function parseTimeToToday(timeString: string) {
    const [hour, minute] = timeString.split(":").map(Number);

    const nowJakarta = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );

    nowJakarta.setHours(hour, minute, 0, 0);
    return nowJakarta;
}

export function getNonPresentLecturersByRegion(
    attendanceData: Attendance[]
): RegionMap {
    return attendanceData
        .filter((a) => !a.GSLC)
        .reduce<RegionMap>((acc, record) => {
            const region = record.CampusName;

            const nonPresent = record.Lecturers.map((lect) => {
                const target =
                    lect.First.Status === "Substituted" ||
                    lect.First.Status === "Permission" ||
                    lect.First.Status === "Special Permission"
                        ? lect.Next
                        : lect.First;

                if (!target || target.Status === "Present" || target.Status === "Cancelled") {
                    return null;
                }

                return {
                    UserName: target.UserName,
                    CourseName: record.CourseName,
                    ClassName: record.ClassName,
                    Room: record.Room,
                } as NonPresentLecturer;
            }).filter((i): i is NonPresentLecturer => i !== null);

            if (nonPresent.length > 0) {
                acc[region] = [...(acc[region] ?? []), ...nonPresent];
            }

            return acc;
        }, {});
}

export async function getNotificationMessages(
    nonPresentLecturers: NonPresentLecturer[]
) {
    const messages = await Promise.all(
        nonPresentLecturers.map(async (lect) => {
            const userId =
                await sql`SELECT line_id FROM assistants WHERE initial = ${lect.UserName}`.then(
                    (res) => (res.length > 0 ? res[0].line_id : null)
                );

            return {
                text: `${lect.CourseName} - ${lect.ClassName} - ${lect.Room}`,
                userId: userId ? userId : lect.UserName,
                mention: userId ? true : false,
            };
        })
    );

    return messages;
}
