import { Router } from "express";

import {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "../controllers/admin-management.controller";

import { requirePermission } from "../middlewares/require-permission";
import { PERMISSIONS } from "../config/permissions";

const router = Router();

// View admins
router.get(
  "/admins",
  requirePermission(PERMISSIONS.ADMINS_VIEW),
  getAdmins,
);

// Create admin
router.post(
  "/admins",
  requirePermission(PERMISSIONS.ADMINS_CREATE),
  createAdmin,
);

// Update admin
router.patch(
  "/admins/:id",
  requirePermission(PERMISSIONS.ADMINS_UPDATE),
  updateAdmin,
);

// Delete admin
router.delete(
  "/admins/:id",
  requirePermission(PERMISSIONS.ADMINS_DELETE),
  deleteAdmin,
);

export default router;