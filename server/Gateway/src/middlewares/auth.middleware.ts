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
        let userData = await redis.get(`user:${userId}`);
        console.log("User data from cache:", userData);
        if (userData) {
            req.user = JSON.parse(userData);
            return next();
        }

        // Fetch from Authentication service if not cached
        try {
            const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://dev-sprint-authentication:4002";
            const response = await axios.get(`${authServiceUrl}/user/${userId}`);
            if (!response?.data?.payload?.user) {
                return res.status(403).json({ message: "Login required" });
            }

            userData = response.data.payload.user;
            await redis.set(`user:${userId}`, JSON.stringify(userData), { EX: 3600 }); // 1 hour cache
            req.user = userData;
            next();
        } catch (err) {
            console.error("Auth service fetch failed:", err.message);
            return res.status(503).json({ message: "Auth service unavailable" });
        }

    } catch (error: any) {
        console.error(error.message);
        return res.status(401).json({ message: error.message });
    }
};