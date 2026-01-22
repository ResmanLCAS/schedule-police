import { StandardResponse } from "@/lib/types";

export async function updateMessierLecturerAttendance(
    class_transaction_detail_id: string,
    note: string,
    status: string,
    user_id: string
): Promise<StandardResponse<void>> {
    try {
        const updateResponse = await fetch(
            `https://bluejack.binus.ac.id/lapi/api/Lecturer/ChangeLecturerAttendance?classTransactionDetailId=${class_transaction_detail_id}&note=${note}&status=${status}&userId=${user_id}`,
            {
                method: "POST",
                headers: {
                    "X-Recsel-Secret": process.env.SLC_X_RECSEL_SECRET!,
                },
            }
        );

        if (!updateResponse.ok) {
            return {
                success: false,
                message: "Failed to update attendance in Messier.",
            };
        }

        return {
            success: true,
            message: "Attendance updated successfully in Messier.",
        };
    } catch (error) {
        console.error("Error updating Messier lecturer attendance:", error);
        return {
            success: false,
            message: "An error occurred while updating attendance in Messier.",
        };
    }
}
