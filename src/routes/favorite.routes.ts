import { Router } from "express";

import {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
} from "../controllers/favorite.controller";

import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

/*
 * All favorite operations require authentication.
 */
router.use(requireAuth);

/*
 * GET /api/favorites
 */
router.get("/", getFavorites);

/*
 * GET /api/favorites/:productId
 */
router.get("/:productId", checkFavorite);

/*
 * POST /api/favorites/:productId
 */
router.post("/:productId", addFavorite);

/*
 * DELETE /api/favorites/:productId
 */
router.delete("/:productId", removeFavorite);

export default router;