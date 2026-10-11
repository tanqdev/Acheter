import { requireAuth } from "../auth/auth.middleware";
import {
  addCartItems,
  deleteCartItem,
  getCartItems,
  updateCartItems,
} from "../controllers/cart.controller";
import { Router } from "express";

const router = Router();

router.post("/", requireAuth, addCartItems);
router.patch("/:productId", requireAuth, updateCartItems);
router.get("/", requireAuth, getCartItems);
router.delete("/:productId", requireAuth, deleteCartItem);

export default router;
