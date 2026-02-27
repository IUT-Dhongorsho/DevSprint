import { Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { redis } from '../utils/redis.js';


export const getStock = async (req: Request, res: Response) => {
    try {
        const d = new Date(Date.now()).toISOString();
        console.log(d)
        const today = new Date().toISOString().split("T")[0];
        const formattedDate = new Date(today).toISOString();
        console.log(formattedDate);
        const qty = await prisma.stock.findUnique({
            where: { forDate: formattedDate },
            select: {
                quantity: true
            }
        })

        if (qty) {
            console.log(qty);
            const cacheKey = `stock:${today.split("T")[0]}`;
            console.log("Caching stock data with key:", cacheKey);
            redis.set(cacheKey, JSON.stringify({ stock: qty.quantity }), { EX: 15 }).catch((e) => {
                console.error("Redis set failed:", e.message);
            });
            return res.status(200).json({ payload: { stock: qty }, message: "Stock data found" });
        }
        else {
            console.error("Stock entry for today was not found.")
            return res.status(404).json({ message: "Stock entry for today was not found." });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to get stock.", error: err.message });
    }
}

export const createStock = async (req: Request, res: Response) => {
    const { quantity, forDate } = req.body;
    const formattedDate = new Date(forDate).toISOString().split("T")[0];
    const reformat = new Date(formattedDate).toISOString();
    try {
        // const today = new Date().toISOString().split("T")[0];
        const stock = await prisma.stock.create({
            data: {
                quantity: quantity,
                forDate: reformat
            }
        })

        if (stock) {
            console.log(stock);
            return res.status(201).json({ payload: { stock: stock }, message: "Stock created successfully" });
        }
        else {
            console.error("Stock entry was not created .")
            return res.status(404).json({ message: "Stock entry was not created." });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to create stock.", error: err.message });
    }
}
export const deleteStock = async (req: Request, res: Response) => {
    const { forDate } = req.params;
    try {
        if (forDate && typeof forDate === "string") {
            const formattedDate = new Date(forDate).toISOString();
            const stock = await prisma.stock.delete({
                where: {
                    forDate: formattedDate
                }
            })

            if (stock) {
                console.log(stock);
                return res.status(200).json({ payload: { stock: stock }, message: "Stock deleted successfully" });
            }
            else {
                console.error("Stock entry was not deleted .")
                return res.status(404).json({ message: "Stock entry was not deleted." });
            }
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to delete stock.", error: err.message });
    }
}