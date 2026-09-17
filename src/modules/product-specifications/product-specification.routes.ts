import { Router } from "express";

import {
  getProductSpecificationsController,
  updateProductSpecificationsController,
} from "./product-specification.controller";

import { requirePermission } from "../../middlewares/require-permission";

import { PERMISSIONS } from "../../config/permissions";

const router = Router();

/* =========================================================
   PRODUCT SPECIFICATIONS
========================================================= */

/**
 * GET /api/admin/products/:id/specifications
 *
 * View schema + existing product specification values.
 */
router.get(
  "/products/:id/specifications",
  requirePermission(PERMISSIONS.PRODUCTS_VIEW),
  getProductSpecificationsController,
);

/**
 * PUT /api/admin/products/:id/specifications
 *
 * Replace schema-driven product specification values.
 */
router.put(
  "/products/:id/specifications",
  requirePermission(PERMISSIONS.PRODUCTS_UPDATE),
  updateProductSpecificationsController,
);

export default router;