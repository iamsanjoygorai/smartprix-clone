import { Router } from "express";

import {
  getAdminSpecifications,
  getAdminSpecification,
  createAdminSpecification,
  updateAdminSpecification,
  deleteAdminSpecification,
} from "../controllers/admin-specification.controller";

import { requirePermission } from "../middlewares/require-permission";

import { PERMISSIONS } from "../config/permissions";

const router = Router();

router.get(
  "/",
  requirePermission(PERMISSIONS.PRODUCTS_VIEW),
  getAdminSpecifications,
);

router.get(
  "/:id",
  requirePermission(PERMISSIONS.PRODUCTS_VIEW),
  getAdminSpecification,
);

router.post(
  "/",
  requirePermission(PERMISSIONS.PRODUCTS_CREATE),
  createAdminSpecification,
);

router.put(
  "/:id",
  requirePermission(PERMISSIONS.PRODUCTS_UPDATE),
  updateAdminSpecification,
);

router.delete(
  "/:id",
  requirePermission(PERMISSIONS.PRODUCTS_DELETE),
  deleteAdminSpecification,
);

export default router;

