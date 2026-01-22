import { sql } from "@/lib/neon";
import { StandardResponse } from "@/lib/types";
import type { Assistant } from "@/lib/types";

export async function getAllAssistants(): Promise<
    StandardResponse<Assistant[]>
> {
    try {
        const assistants = (await sql`
            SELECT 
                initial,
                role
            FROM assistants
            ORDER BY initial ASC
        `) as Assistant[];

        return {
            success: true,
            message: "Assistants fetched successfully.",
            data: assistants,
        };
    } catch (error) {
        console.error("Error fetching assistants:", error);
        return {
            success: false,
            message: "Failed to fetch assistants.",
        };
    }
}

export async function updateRole(
    initial: string,
    role: string
): Promise<StandardResponse<null>> {
    try {
        const result = await sql`
            UPDATE assistants
            SET role = ${role}
            WHERE initial = ${initial}
            RETURNING initial
        `;

        if (result.length === 0) {
            return {
                success: false,
                message: "No assistant found with the given initial.",
            };
        }

        return {
            success: true,
            message: "Role updated successfully.",
        };
    } catch (error) {
        console.error("Error updating assistant role:", error);
        return {
            success: false,
            message: "Failed to update role.",
        };
    }
}

export async function getInitialFromLineId(
    lineId: string
): Promise<StandardResponse<string>> {
    try {
        const result = await sql`
            SELECT initial FROM assistants WHERE line_id = ${lineId}
        `;
        if (result.length === 0) {
            return {
                success: false,
                message: "No assistant found with the given Line ID.",
            };
        }

        return {
            success: true,
            message: "Initial fetched successfully.",
            data: result[0].initial,
        };
    } catch (error) {
        console.error("Error fetching initial from Line ID:", error);
        return {
            success: false,
            message: "Failed to fetch initial.",
        };
    }
}
