import type { Request, Response, NextFunction } from "express";
import { decodeJwt } from "../utils/jwt.js";
import { redis } from "../utils/redis.js";
import axios from "axios";

interface AuthenticatedRequest extends Request {
    user?: any;
}

export const userGuard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Unauthorized" });

        const userId = decodeJwt(token);
        if (!userId || typeof userId !== "string") {
            return res.status(401).json({ message: "Invalid token" });
        }

        // Check Redis cache first
        let userData: string | null = null;

        try {
            userData = await redis.get(`user:${userId}`);
            console.log("User data from cache:", JSON.parse(userData));
        } catch (redisError: any) {
            console.error("Redis error:", redisError.message);
            // DO NOT return — just continue
        }

        if (userData) {
            req.user = JSON.parse(userData);
            return next();
        }

        try {
            const identityServiceUrl = process.env.IDENTITY_SERVICE_URL || "http://dev-sprint-identity:4002";
            const response = await axios.get(`${identityServiceUrl}/users/${userId}`);

            const userDataFromSvc = response?.data?.payload?.user;
            if (!userDataFromSvc) {
                return res.status(403).json({ message: "Login required" });
            }

            req.user = userDataFromSvc;

            // Try caching in Redis, but don't block the request
            try {
                await redis.set(`user:${userId}`, JSON.stringify(userDataFromSvc), { expiration: { type: "EX", value: 3600 } }); // Cache for 1 hour
            } catch (redisError: any) {
                console.error("Redis set failed:", redisError.message);
            }

            next();
        } catch (err: any) {
            console.error("Identity service fetch failed:", err.message, err.status);
            if (err.status === 404) {
                return res.status(403).json({ message: "Invalid token, login required" });
            }
            return res.status(503).json({
                message: "Identity service unavailable",
                error: err.message,
                status: err.status
            });
        }

    } catch (error: any) {
        console.error(error.message);
        return res.status(401).json({ message: error.message });
    }
};