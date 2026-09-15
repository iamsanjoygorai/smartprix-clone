import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";

import {
  deleteMyAccount,
  getMySessions,
} from "./account.controller";

import {
  updateCompleteProfile,
} from "../../controllers/user.controller";

import {
  profileImageUpload,
} from "../../middlewares/upload.middleware";

const router = Router();

router.delete(
  "/account",
  requireAuth,
  deleteMyAccount,
);

router.get(
  "/sessions",
  requireAuth,
  getMySessions,
);

router.patch(
  "/complete",
  requireAuth,
  profileImageUpload.single("profileImage"),
  updateCompleteProfile,
);

export default router;