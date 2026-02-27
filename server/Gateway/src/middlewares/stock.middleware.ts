import type { Request, Response, NextFunction } from "express";
import { decodeJwt } from "../utils/jwt.js";
import { redis } from "../utils/redis.js";
import axios from "axios";


export const stockGuard = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log(`Stock guard checking for ${req.method} ${req.path}`);
        if (req.path === "/stock") {
            console.log("Bypassing stock check for stock creation endpoint");
            return next();
        }
        console.log("Checking stock availability...");
        const today = new Date().toISOString().split("T")[0];
        const cacheKey = `stock:${today}`;
        console.log("Cache key for stock:", cacheKey);

        let stockData: string | null = null;

        // Try Redis
        try {
            stockData = await redis.get(cacheKey);
            console.log("Stock data from cache:", stockData);
        } catch (redisError: any) {
            console.error("Redis error:", redisError.message);
        }

        if (stockData) {
            const qty = JSON.parse(stockData).stock;
            console.log("Stock quantity from cache:", qty);
            if (qty > 0) return next();
        }

        // Fallback to Inventory service
        console.log("Fallback to Inventory service")
        try {
            const inventoryUrl =
                process.env.INVENTORY_SERVICE_URL || "http://dev-sprint-inventory:8007";

            const response = await axios.get(`${inventoryUrl}/stock`);
            const qty = response.data?.payload?.stock?.quantity;

            if (qty > 0) {
                // update cache
                try {
                    await redis.set(cacheKey, JSON.stringify({ stock: qty }), { EX: 15 });
                } catch (e) {
                    console.error("Redis set failed:", (e as any).message);
                }

                return next();
            }

            return res.status(409).json({ message: "Insufficient stock" });
        } catch (err: any) {
            console.error("Inventory fetch failed:", err.message);
            return res.status(503).json({ message: "Inventory unavailable", error: err.message });
        }
    } catch (error: any) {
        console.error(error.message);
        return res.status(500).json({ message: "Internal error" });
    }
};