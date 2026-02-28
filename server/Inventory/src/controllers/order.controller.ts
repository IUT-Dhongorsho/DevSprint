import { Request, Response } from "express";
import { OrderService } from "../services/order.service.js";

export const getOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: "Missing order id" });
        }

        const order = await OrderService.getOrderById(id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.status(200).json({
            payload: { order },
            message: "Order found",
        });
    } catch (err: any) {
        return res.status(500).json({
            message: "Failed to fetch order",
            error: err.message,
        });
    }
};

export const createOrder = async (req: Request, res: Response) => {
    try {
        const userId = req.headers.user_id;
        console.log(req.headers);
        const formattedDate = new Date().toISOString().split('T')[0];
        const reformat = new Date(formattedDate).toISOString();

        if (!userId || !reformat || typeof userId !== 'string') {
            return res.status(400).json({
                message: "userId and forDate are required",
            });
        }
        console.log(userId, reformat);
        const order = await OrderService.createOrder(userId, reformat);

        return res.status(201).json({
            payload: { order },
            message: "Order created successfully",
        });

    } catch (err: any) {
        if (err.message === "OUT_OF_STOCK") {
            return res.status(409).json({ message: "Out of stock" });
        }
        console.log(err);
        return res.status(500).json({
            message: "Failed to create order",
            error: err.message,
        });
    }
};


// export const updateOrder = async (req: Request, res: Response) => {
//     try {
//         const { id, status } = req.body;

//         if (!id || !status) {
//             return res.status(400).json({
//                 message: "id and status are required",
//             });
//         }

//         const updated = await OrderService.updateOrder(id, status);

//         return res.status(200).json({
//             payload: { order: updated },
//             message: "Order updated successfully",
//         });
//     } catch (err: any) {
//         return res.status(500).json({
//             message: "Failed to update order",
//             error: err.message,
//         });
//     }
// };


export const deleteOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: "Missing order id" });
        }

        const deleted = await OrderService.deleteOrder(id);

        return res.status(200).json({
            payload: { order: deleted },
            message: "Order deleted successfully",
        });
    } catch (err: any) {
        return res.status(500).json({
            message: "Failed to delete order",
            error: err.message,
        });
    }
};