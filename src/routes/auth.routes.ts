import { Router } from "express";

import {
  login,
  register,
  getMe,
  firebaseLogin,
} from "../controllers/auth.controller";

import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/login", login);

router.post("/register", register);

router.post("/firebase", firebaseLogin);

router.get("/me", requireAuth, getMe);

export default router;