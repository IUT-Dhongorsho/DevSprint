// services/order.service.ts

import prisma from "../utils/prisma.js";
import { StockService } from "./stock.service.js";
import { mq } from "../utils/mq.js";
import { redis } from "../utils/redis.js";

export class OrderService {

    static async getOrderById(id: string) {
        return prisma.order.findUnique({
            where: { id },
            include: { ticket: true, stock: true },
        });
    }
    static async getAllOrders() {
        return prisma.order.findMany();
    }

    static async createOrder(userId: string, forDate: string) {

        const stockId = await StockService.reserveStock(forDate);
        try {
            const order = await prisma.order.create({
                data: {
                    user_id: userId,
                    stock_id: stockId,
                    status: "PENDING",
                    forDate: forDate
                },
            });

            // After this event it will wait for accept or reject from kitchen
            await mq.publish("order.created", {
                userId: order.user_id,
                orderId: order.id,
            });

            return order;

        } catch (err) {

            await StockService.releaseStock(stockId);
            throw err;
        }
    }


    static async markInKitchen(orderId: string) {
        // After accept from kitchen via kitchen.job.accept: 
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                user_id: true,
                stock_id: true
            }
        });

        if (!order) {
            throw new Error("ORDER_NOT_FOUND");
        }

        await StockService.useStock(order.stock_id);

        await mq.publish("order.in_kitchen", {
            userId: order.user_id,
            orderId,
        });
    }

    static async markFailed(orderId: string, reason?: string) {
        // After reject from kitchen via kitchen.job.reject:
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new Error("ORDER_NOT_FOUND");
        }

        // Stock: RESERVED -> AVAILABLE
        await StockService.releaseStock(order.stock_id);

        const updated = await prisma.order.update({
            where: { id: orderId },
            data: { status: "FAILED" },
            select: {
                user_id: true
            }
        });

        await mq.publish("order.failed", {
            userId: updated.user_id,
            orderId,
            reason: reason || null,
        });

        return updated;
    }
    static async markCancelled(orderId: string, reason?: string) {
        // After cancel from kitchen from user:
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new Error("ORDER_NOT_FOUND");
        }

        // Stock: RESERVED -> AVAILABLE
        await StockService.releaseStock(order.stock_id);

        const updated = await prisma.order.update({
            where: { id: orderId },
            data: { status: "FAILED" },
            select: {
                user_id: true
            }
        });

        await mq.publish("order.cancelled", {
            userId: updated.user_id,
            orderId,
            reason: reason || null,
        });

        return updated;
    }



    static async markCompleted(orderId: string) {

        const updated = await prisma.order.update({
            where: { id: orderId },
            data: { status: "COMPLETED" },
            select: {
                user_id: true
            }
        });

        await mq.publish("order.completed", {
            userId: updated.user_id,
            orderId,
        });

        return updated;
    }

    static async deleteOrder(id: string) {
        return prisma.order.delete({
            where: { id },
        });
    }
}