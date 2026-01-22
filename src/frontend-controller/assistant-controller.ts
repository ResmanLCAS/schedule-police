import { StandardResponse } from "@/lib/types";

export async function GetConnectionString(): Promise<StandardResponse<string>> {
    const response = await fetch("/api/assistant/self", {
        method: "GET",
    });

    return await response.json();
}

// export async function Li
