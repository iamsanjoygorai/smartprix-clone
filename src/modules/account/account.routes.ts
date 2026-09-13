import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";

import {
  deleteMyAccount,
  getMySessions,
} from "./account.controller";

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


export default router;