import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { checkout } from "../controllers/order.controller";

const router = Router();

router.post("/", requireAuth, checkout);

export default router;
