import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { deleteMyAccount } from "./account.controller";

const router = Router();

router.delete(
  "/account",
  requireAuth,
  deleteMyAccount,
);

export default router;