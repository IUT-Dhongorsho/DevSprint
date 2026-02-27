import { Router } from "express";
import { getStatus } from "../controllers/order.controller.js";

const router = Router();

router.get('/', getStatus);

export default router;