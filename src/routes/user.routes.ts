import { Router } from "express";

import {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
  deleteProfileImage,
} from "../controllers/user.controller";

import { requireAuth } from "../middlewares/auth.middleware";

import {
  profileImageUpload,
} from "../middlewares/upload.middleware";

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

/* =========================================================
   PROFILE IMAGE
========================================================= */

router.post(
  "/profile/image",
  profileImageUpload.single("image"),
  uploadProfileImage,
);

router.delete(
  "/profile/image",
  deleteProfileImage,
);

export default router;