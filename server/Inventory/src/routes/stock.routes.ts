import { Router } from "express";
import { createStock, deleteStock, getStock, getStockQty, getStocksByDate } from "../controllers/stock.controller.js";

const router = Router();

router.get('/', getStockQty);
router.get('/id/:id', getStock);
router.get('/date/:forDate', getStocksByDate);
router.post('/', createStock);
router.delete('/:forDate', deleteStock);

export default router;