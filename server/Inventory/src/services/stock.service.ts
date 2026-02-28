// services/stock.service.ts

import prisma from "../utils/prisma.js";
import { redis } from "../utils/redis.js";

export class StockService {
    static async getStockQty(forDate: string) {
        const formattedDate = new Date(forDate).toISOString();

        const qty = await prisma.stock.count({
            where: {
                forDate: formattedDate,
                status: "AVAILABLE",
            },
        });

        if (qty > 0) {
            const cacheKey = `stock:${formattedDate.split("T")[0]}`;
            await redis
                .set(cacheKey, JSON.stringify({ stock: qty }), { EX: 15 })
                .catch(() => { });
        }

        return qty;
    }

    static async getStockById(id: string) {
        return prisma.stock.findUnique({
            where: { id },
        });
    }

    static async getStocksByDate(forDate: string) {
        console.log("forDate", forDate)
        const formattedDate = new Date(forDate).toISOString();
        const reformat = new Date(formattedDate.split('T')[0]).toISOString()
        return prisma.stock.findMany({
            where: {
                forDate: reformat
            }
        })
    }

    static async createStock(quantity: number, forDate: string) {
        const formattedDate = new Date(forDate).toISOString();

        return prisma.stock.createMany({
            data: Array.from({ length: quantity }, () => ({
                forDate: formattedDate,
                status: "AVAILABLE",
            })),
        });
    }

    static async deleteStocksByDate(forDate: string) {
        const formattedDate = new Date(forDate).toISOString();

        return prisma.stock.deleteMany({
            where: { forDate: formattedDate },
        });
    }


    static async deleteStockById(id: string) {
        return prisma.stock.delete({
            where: { id },
        });
    }


    static async reserveStock(forDate: string) {
        const formattedDate = new Date(forDate).toISOString();

        return prisma.$transaction(async (tx) => {
            const stock = await tx.stock.findFirst({
                where: {
                    forDate: formattedDate,
                    status: "AVAILABLE",
                },
                orderBy: { createdAt: "asc" },
            });

            if (!stock) {
                throw new Error("OUT_OF_STOCK");
            }

            const reserved = await tx.stock.update({
                where: { id: stock.id },
                data: { status: "RESERVED" },
            });

            return reserved.id;
        });
    }

    static async useStock(stockId: string) {
        return prisma.stock.update({
            where: { id: stockId },
            data: { status: "USED" },
        });
    }

    static async releaseStock(stockId: string) {
        return prisma.stock.update({
            where: { id: stockId },
            data: { status: "AVAILABLE" },
        });
    }
}