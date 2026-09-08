import { Router } from "express";

import {
  getAdminBrands,
  getAdminBrand,
  createAdminBrand,
  updateAdminBrand,
  deleteAdminBrand,
} from "../controllers/admin-brand.controller";

import { requirePermission } from "../middlewares/require-permission";
import { PERMISSIONS } from "../config/permissions";

const router = Router();

router.get(
  "/",
  requirePermission(PERMISSIONS.PRODUCTS_VIEW),
  getAdminBrands,
);

router.get(
  "/:id",
  requirePermission(PERMISSIONS.PRODUCTS_VIEW),
  getAdminBrand,
);

router.post(
  "/",
  requirePermission(PERMISSIONS.PRODUCTS_CREATE),
  createAdminBrand,
);

router.put(
  "/:id",
  requirePermission(PERMISSIONS.PRODUCTS_UPDATE),
  updateAdminBrand,
);

router.delete(
  "/:id",
  requirePermission(PERMISSIONS.PRODUCTS_DELETE),
  deleteAdminBrand,
);

export default router;