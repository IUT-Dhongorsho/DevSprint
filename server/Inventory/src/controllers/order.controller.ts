import { Request, Response } from "express";
import prisma from "../utils/prisma.js";


export const getStatus = async (req: Request, res: Response) => {
    try {
        res.status(200).json({ message: "Inventory Order Service is workng fine" });
    } catch (err) {
        console.log(err);
    }
}
