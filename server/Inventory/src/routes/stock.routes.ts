import { Router } from "express";
import { createStock, deleteStock, deleteStocks, getStock, getStockQty, getStocksByDate } from "../controllers/stock.controller.js";

const router = Router();

router.get('/date/:forDate', getStocksByDate);
router.get('/:id', getStock);
router.get('/', getStockQty);
router.post('/', createStock);
router.delete('/date/:forDate', deleteStocks);
router.delete('/:id', deleteStock);

export default router;