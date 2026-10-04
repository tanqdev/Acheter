import { Router } from "express";

import { signup, login, logout, getMe } from "./auth.controller";
import { requireAuth } from "./auth.middleware";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);

export default router;
