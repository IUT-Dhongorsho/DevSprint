import { createSession, Session } from "better-sse";
import { Request, Response } from "express";
import { redis } from "../utils/redis.js";

type UserId = string;
type OrderId = string;
type Status = "PENDING" | "STOCK VERIFIED" | "IN KITCHEN" | "READY";

class NotificationService {

    private sessions: Map<UserId, Set<Session>> = new Map();
    private userOrders: Map<UserId, Set<OrderId>> = new Map();


    async registerSession(req: Request, res: Response, userId: UserId) {
        const session = await createSession(req, res, {
            retry: 3000,
        });

        const userSessions = this.sessions.get(userId) ?? new Set();
        userSessions.add(session);
        this.sessions.set(userId, userSessions);

        session.on("close", () => {
            userSessions.delete(session);
            if (userSessions.size === 0) {
                this.sessions.delete(userId);
            }
        });

        this.sessions.forEach((val: Set<Session>, key: string) => {
            console.log("User ID", key, ", Connections", val.size);
        })

        return session;
    }

    /* ===============================
       ORDER REGISTRATION
       Called from domain layer, NOT controller
       =============================== */

    async registerOrder(userId: UserId, orderId: OrderId) {
        // In-memory
        const orders = this.userOrders.get(userId) ?? new Set();
        orders.add(orderId);
        this.userOrders.set(userId, orders);

        // Redis
        await redis.sAdd(`user:orders:${userId}`, orderId);
        await redis.set(`order:user:${orderId}`, userId);
    }

    async removeOrder(orderId: OrderId) {
        const userId = await redis.get(`order:user:${orderId}`) as string;
        if (!userId) return;

        // In-memory cleanup
        const orders = this.userOrders.get(userId);
        if (orders) {
            orders.delete(orderId);
            if (orders.size === 0) {
                this.userOrders.delete(userId);
            }
        }

        // Redis cleanup
        await redis.sRem(`user:orders:${userId}`, orderId);
        await redis.del(`order:user:${orderId}`);
    }

    /* ===============================
       INTERNAL PUSH
       =============================== */

    private push(userId: UserId, event: string, payload: unknown) {
        const userSessions = this.sessions.get(userId);
        if (!userSessions || userSessions.size === 0) {
            return false;
        }

        for (const session of userSessions) {
            session.push(payload, event);
        }

        return true;
    }

    /* ===============================
       DOMAIN EVENTS
       =============================== */

    async pushOrderStatus(
        userId: UserId,
        orderId: OrderId,
        status: Status
    ) {
        const payload = {
            orderId,
            status,
            timestamp: Date.now(),
        };

        this.push(userId, "order-status", payload);

        if (status === "READY") {
            await this.removeOrder(orderId);
        }
    }

    pushSystemNotification(userId: UserId, message: string) {
        return this.push(userId, "system", {
            message,
            timestamp: Date.now(),
        });
    }

    pushBroadcast(event: string, payload: unknown) {
        for (const userSessions of this.sessions.values()) {
            for (const session of userSessions) {
                session.push(payload, event);
            }
        }
    }



    async hydrateUserOrders(userId: UserId) {
        const orderIds: Array<string> = await redis.sMembers(`user:orders:${userId}`) as Array<string>;
        if (!orderIds.length) return;

        this.userOrders.set(userId, new Set(orderIds));
    }
}

export const notificationService = new NotificationService();