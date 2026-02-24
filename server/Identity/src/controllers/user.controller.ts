import { Request, Response } from "express";
import prisma from "../utils/prisma.js";
export const getUser = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        if (!id || typeof id !== "string") {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                institution_id: true,
            },
        });

        if (!user) {
            return res.status(404).json({ message: "No user found" });
        }

        res.status(200).json({ payload: { user } });
    } catch (error: any) {
        console.error("Get user failed:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};