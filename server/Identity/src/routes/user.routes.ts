import { Router } from "express";
import { getUser } from "../controllers/user.controller.js";

const router = Router();
router.get('/:id', getUser);

export default router;