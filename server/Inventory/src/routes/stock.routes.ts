import { Router } from "express";
import { createStock, deleteStock, getStock } from "../controllers/stock.controller.js";

const router = Router();

router.get('/', getStock);
router.post('/', createStock);
router.delete('/:forDate', deleteStock);

export default router;