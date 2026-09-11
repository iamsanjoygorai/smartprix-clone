import { Router } from "express";

import {
  login,
  register,
  getMe,
  firebaseLogin,
  updateProfile,
} from "../controllers/auth.controller";

import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

/* =========================================================
   AUTHENTICATION
========================================================= */

router.post("/login", login);

router.post("/register", register);

router.post("/firebase", firebaseLogin);

/* =========================================================
   CURRENT USER
========================================================= */

router.get(
  "/me",
  requireAuth,
  getMe,
);

/* =========================================================
   PROFILE
========================================================= */

router.patch(
  "/profile",
  requireAuth,
  updateProfile,
);

export default router;