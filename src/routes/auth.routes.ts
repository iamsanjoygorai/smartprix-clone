import { Router } from "express";

import { requireAuth } from "../middlewares/auth.middleware";

import {
  login,
  register,
  logout,
} from "../controllers/auth.controller";

import {
  getProfile,
  updateProfile,
} from "../controllers/user.controller";

const router = Router();

/* =========================================================
   AUTHENTICATION
========================================================= */

router.post("/login", login);

router.post(
  "/logout",
  requireAuth,
  logout,
);

router.post("/register", register);

/* =========================================================
   CURRENT USER
========================================================= */

router.get(
  "/me",
  requireAuth,
  getProfile,
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