import { Router } from "express";
import {
  forgotPassword,
  resetUserPassword,
} from "../controllers/auth-password.controller";

const router = Router();

router.post(
  "/forgot-password",
  forgotPassword,
);

router.post(
  "/reset-password",
  resetUserPassword,
);

export default router;