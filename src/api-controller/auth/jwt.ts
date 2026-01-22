import "dotenv/config";
import jwt from "jsonwebtoken";
import { StandardResponse, User } from "@/lib/types";

const SECRET_KEY = process.env.JWT_SECRET;

export function generateToken(payload: User): StandardResponse<string> {
    if (!SECRET_KEY) {
        console.error("JWT_SECRET is not defined in environment variables");
        return {
            success: false,
            message: "An error occured during token generation.",
        };
    }

    return {
        success: true,
        message: "Token generated successfully",
        data: jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" }),
    };
}

export function verifyToken(token: string): StandardResponse<User | null> {
    if (!SECRET_KEY) {
        console.error("JWT_SECRET is not defined in environment variables");
        return {
            success: false,
            message: "An error occured during token validation.",
            data: null,
        };
    }

    try {
        return {
            success: true,
            message: "Token verified successfully.",
            data: jwt.verify(token, SECRET_KEY) as User,
        };
    } catch (e) {
        console.error("Token verification failed: ", e);
        return {
            success: false,
            message: "Token verification failed.",
            data: null,
        };
    }
}
