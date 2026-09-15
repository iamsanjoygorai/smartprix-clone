import { Router } from "express";

import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  uploadProfileImage,
  deleteProfileImage,
} from "../controllers/user.controller";

import { requireAuth } from "../middlewares/auth.middleware";

import {
  profileImageUpload,
} from "../middlewares/upload.middleware";

const router = Router();

/*
 * =========================================================
 * AUTHENTICATION
 * =========================================================
 *
 * Every user-account endpoint requires authentication.
 */
router.use(requireAuth);

/*
 * =========================================================
 * PROFILE
 * =========================================================
 */

/**
 * GET /api/user/profile
 *
 * Get the currently authenticated user's profile.
 */
router.get(
  "/profile",
  getProfile,
);

/**
 * PUT /api/user/profile
 *
 * Update profile information.
 *
 * Note:
 * This is the old profile update endpoint.
 * The new combined Save Changes endpoint is:
 *
 * PATCH /api/profile/complete
 */
router.put(
  "/profile",
  updateProfile,
);

/*
 * =========================================================
 * PASSWORD
 * =========================================================
 */

/**
 * PUT /api/user/password
 *
 * Change the authenticated user's password.
 */
router.put(
  "/password",
  changePassword,
);

/*
 * =========================================================
 * ACCOUNT
 * =========================================================
 */

/**
 * DELETE /api/user/account
 *
 * Delete/disable the authenticated user's account.
 */
router.delete(
  "/account",
  deleteAccount,
);

/*
 * =========================================================
 * PROFILE IMAGE
 * =========================================================
 */

/**
 * POST /api/user/profile/image
 *
 * Upload/change profile image using the old standalone
 * image-upload endpoint.
 *
 * Field name:
 * image
 */
router.post(
  "/profile/image",
  profileImageUpload.single("image"),
  uploadProfileImage,
);

/**
 * DELETE /api/user/profile/image
 *
 * Immediately remove the current profile image.
 */
router.delete(
  "/profile/image",
  deleteProfileImage,
);

export default router;