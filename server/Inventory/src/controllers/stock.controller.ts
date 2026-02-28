// controllers/stock.controller.ts

import { Request, Response } from "express";
import { StockService } from "../services/stock.service.js";

export const getStockQty = async (req: Request, res: Response) => {
    try {
        const forDate = new Date().toISOString().split('T')[0];
        const reformat = new Date(forDate).toISOString();
        const qty = await StockService.getStockQty(reformat);

        if (qty > 0) {
            return res.status(200).json({
                payload: { stock: { quantity: qty } },
                message: "Stock data found",
            });
        }

        return res.status(404).json({
            message: "Stock count for the day was not found.",
        });
    } catch (err: any) {
        return res.status(500).json({
            message: "Failed to get stock count.",
            error: err.message,
        });
    }
};



export const getStock = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: "Missing stock id" });
        }

        const stock = await StockService.getStockById(id);

        if (!stock) {
            return res.status(404).json({ message: "Stock not found" });
        }

        return res.status(200).json({
            payload: { stock },
            message: "Stock data found",
        });
    } catch (err: any) {
        return res.status(500).json({
            message: "Failed to get stock entry",
            error: err.message,
        });
    }
};
export const getStocksByDate = async (req: Request, res: Response) => {
    try {
        const { forDate } = req.params;
        console.log("From controller", forDate);
        if (!forDate || typeof forDate != 'string') {
            return res.status(400).json({ message: "Missing date" });
        }

        const stocks = await StockService.getStocksByDate(forDate);
        // console.log(stocks);
        if (!stocks) {
            return res.status(404).json({ message: "Stock entries not found" });
        }

        return res.status(200).json({
            payload: { stocks },
            message: "Stock data found",
        });
    } catch (err: any) {
        return res.status(500).json({
            message: "Failed to get stock entry",
            error: err.message,
        });
    }
};


export const createStock = async (req: Request, res: Response) => {
    try {
        const { quantity, forDate } = req.body;

        if (!quantity || !forDate) {
            return res.status(400).json({
                message: "quantity and forDate are required",
            });
        }

        const result = await StockService.createStock(quantity, forDate);

        return res.status(201).json({
            payload: { stock: result },
            message: "Stock created successfully",
        });
    } catch (err: any) {
        return res.status(500).json({
            message: "Failed to create stock",
            error: err.message,
        });
    }
};


export const deleteStocks = async (req: Request, res: Response) => {
    try {
        const { forDate } = req.params;

        if (!forDate || typeof forDate !== 'string') {
            return res.status(400).json({ message: "Missing forDate" });
        }

        const result = await StockService.deleteStocksByDate(forDate);

        return res.status(200).json({
            payload: { stocks: result },
            message: "Stock entries deleted successfully",
        });
    } catch (err: any) {
        return res.status(500).json({
            message: "Failed to delete stock entries",
            error: err.message,
        });
    }
};


export const deleteStock = async (req: Request, res: Response) => {
    try {
        const { stockId } = req.params;

        if (!stockId || typeof stockId !== 'string') {
            return res.status(400).json({ message: "Missing stockId" });
        }

        const result = await StockService.deleteStockById(stockId);

        return res.status(200).json({
            payload: { stock: result },
            message: "Stock entry deleted successfully",
        });
    } catch (err: any) {
        return res.status(500).json({
            message: "Failed to delete stock entry",
            error: err.message,
        });
    }
};