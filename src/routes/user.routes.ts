import { Router } from "express";

import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/user.controller";

import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

/*
 * Every user-account endpoint requires
 * authentication.
 */
router.use(requireAuth);

router.get(
  "/profile",
  getProfile,
);

router.put(
  "/profile",
  updateProfile,
);

router.put(
  "/password",
  changePassword,
);

export default router;