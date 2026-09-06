import { Router } from "express";

import {
  createCategory,
  deleteCategory,
  getNewsCategories,
  getNewsCategory,
  updateCategory,
} from "../controllers/news-category.controller";

import { requirePermission } from "../middlewares/require-permission";
import { PERMISSIONS } from "../config/permissions";

const router = Router();

// View all news categories
router.get(
  "/",
  requirePermission(PERMISSIONS.NEWS_VIEW),
  getNewsCategories,
);

// Create news category
router.post(
  "/",
  requirePermission(PERMISSIONS.NEWS_CREATE),
  createCategory,
);

// View single news category
router.get(
  "/:id",
  requirePermission(PERMISSIONS.NEWS_VIEW),
  getNewsCategory,
);

// Update news category
router.put(
  "/:id",
  requirePermission(PERMISSIONS.NEWS_UPDATE),
  updateCategory,
);

// Delete news category
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.NEWS_DELETE),
  deleteCategory,
);

export default router;