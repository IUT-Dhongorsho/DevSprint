import { Router } from "express";
import { loginUser, getStatus, registerUser } from "../controllers/auth.controller.js";

const router = Router();
router.get('/', getStatus);
router.post('/login', loginUser);
router.post('/register', registerUser);

export default router;