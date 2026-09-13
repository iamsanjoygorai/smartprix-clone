import { Router } from "express";

import {
  searchSuggestions,
  recordSearch,
} from "../controllers/search.controller";

import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

/*
 * GET /api/search/suggestions?q=samsung
 */
router.get(
  "/suggestions",
  searchSuggestions,
);

/*
 * POST /api/search/record
 */
router.post(
  "/record",
  requireAuth,
  recordSearch,
);

export default router;