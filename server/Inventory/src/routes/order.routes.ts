import { Router } from "express";
import { createOrder, deleteOrder, getOrder, getOrders } from "../controllers/order.controller.js";
// import { getStatus } from "../controllers/order.controller.js";

const router = Router();

// router.get('/', getStatus);
router.post('/', createOrder);
router.get('/:id', getOrder);
router.get('/', getOrders);
router.delete('/:id', deleteOrder);


export default router;