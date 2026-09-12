import { Router } from "express";

import { getMyProfileHistory } from "../controllers/profile-history.controller";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// =========================================================
// MY PROFILE HISTORY
// =========================================================

router.get(
"/history",
requireAuth,
getMyProfileHistory,
);

export default router;
