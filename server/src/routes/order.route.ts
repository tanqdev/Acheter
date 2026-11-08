import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { checkout, getOrders } from "../controllers/order.controller";

const router = Router();

router.post("/", requireAuth, checkout);
router.get("/", requireAuth, getOrders);

export default router;
