import { generateToken } from "@/api-controller/auth/jwt";
import { sql } from "@/lib/neon";
import { LoginResponse, StandardResponse, User } from "@/lib/types";

export async function validateUser(
    username: string,
    password: string
): Promise<StandardResponse<LoginResponse>> {
    const response = await fetch(
        "https://bluejack.binus.ac.id/lapi/api/Account/LogOn",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                username,
                password,
            }),
        }
    );

    if (response.ok) {
        const data = await response.json();
        if (data && data.access_token !== "") {
            await sql`
                INSERT INTO assistants (initial, messier_token, expires_at)
                VALUES (${username}, ${data.access_token}, ${new Date(
                Date.now() + 24 * 59 * 60 * 1000
            )})
                ON CONFLICT (initial) DO UPDATE
                SET messier_token = EXCLUDED.messier_token,
                    expires_at = EXCLUDED.expires_at
            `;

            const response = await sql`
                SELECT role, line_id FROM assistants WHERE initial = ${username} 
            `;
            const userRecord = response[0];

            const accessTokenData: User = {
                username: username,
                role: userRecord?.role ?? "user",
                line_id: userRecord?.line_id ?? "",
            };

            const SPAccessTokenResponse = generateToken(accessTokenData);
            if (!SPAccessTokenResponse.success || !SPAccessTokenResponse.data) {
                return {
                    success: false,
                    message: "An error occured while attempting to log in.",
                };
            }
            return {
                success: true,
                message: "Successfully logged in!",
                data: {
                    access_token: SPAccessTokenResponse.data,
                    user: accessTokenData,
                },
            };
        }
    }
    return { success: false, message: "Invalid credentials." };
}

export const AUTH_COOKIE_NAME = "auth_token";

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 60 * 60,
    path: "/",
};
