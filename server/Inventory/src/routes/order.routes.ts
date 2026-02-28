import { Router } from "express";
import { createOrder, getOrder } from "../controllers/order.controller.js";
// import { getStatus } from "../controllers/order.controller.js";

const router = Router();

// router.get('/', getStatus);
router.post('/', createOrder);
router.get('/:id', getOrder);

export default router;