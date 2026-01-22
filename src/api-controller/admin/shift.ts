import { sql } from "@/lib/neon";
import { Shift, StandardResponse } from "@/lib/types";

export async function refreshShifts(): Promise<StandardResponse<null>> {
    try {
        const response = await fetch(
            "https://bluejack.binus.ac.id/lapi/api/Lecturer/GetShifts",
            {
                method: "GET",
                headers: {
                    "X-Recsel-Secret": process.env.SLC_X_RECSEL_SECRET!,
                },
            }
        );

        const shiftsData = (await response.json()) as Shift[];

        if (!shiftsData || shiftsData.length === 0) {
            return { success: false, message: "No shifts data found." };
        }

        await sql.transaction((tx) => {
            const queries = [tx`TRUNCATE TABLE shifts`];

            for (const s of shiftsData) {
                queries.push(tx`
                    INSERT INTO shifts ("ShiftId", "Start", "End")
                    VALUES (${s.ShiftId}, ${s.Start}, ${s.End})
                `);
            }

            return queries;
        });

        return {
            success: true,
            message: `Successfully refreshed ${shiftsData.length} shifts.`,
        };
    } catch (error) {
        console.error("Error refreshing shifts:", error);
        return {
            success: false,
            message: "Failed to refresh shifts.",
        };
    }
}
