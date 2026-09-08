import { Router } from "express";

import {
  getAdminCategories,
  getAdminCategory,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from "../controllers/admin-category.controller";

import { requirePermission } from "../middlewares/require-permission";

import { PERMISSIONS } from "../config/permissions";

const router = Router();

// View all categories
router.get(
  "/",
  requirePermission(PERMISSIONS.CATEGORIES_VIEW),
  getAdminCategories,
);

// View single category
router.get(
  "/:id",
  requirePermission(PERMISSIONS.CATEGORIES_VIEW),
  getAdminCategory,
);

// Create category
router.post(
  "/",
  requirePermission(PERMISSIONS.CATEGORIES_CREATE),
  createAdminCategory,
);

// Update category
router.put(
  "/:id",
  requirePermission(PERMISSIONS.CATEGORIES_UPDATE),
  updateAdminCategory,
);

// Delete category
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.CATEGORIES_DELETE),
  deleteAdminCategory,
);

export default router;