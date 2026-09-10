import { Router } from "express";

import {
  forgotPassword,
  sendVerificationCode,
  verifyCode,
  resendVerificationCode,
  resetUserPassword,
} from "../controllers/auth-password.controller";

const router = Router();

// Step 1 — find account
router.post(
  "/forgot-password",
  forgotPassword,
);

// Step 3 — send 6-digit code
router.post(
  "/password-reset/send-code",
  sendVerificationCode,
);

// Step 4 — verify 6-digit code
router.post(
  "/password-reset/verify-code",
  verifyCode,
);

// Step 4 — resend code
router.post(
  "/password-reset/resend-code",
  resendVerificationCode,
);

// Step 5 — create new password
router.post(
  "/reset-password",
  resetUserPassword,
);

export default router;