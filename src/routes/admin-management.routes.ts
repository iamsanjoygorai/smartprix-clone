import { Router } from "express";

import {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "../controllers/admin-management.controller";

import { requirePermission } from "../middlewares/require-permission";
import { PERMISSIONS } from "../config/permissions";
import {
  getUserPermissions,
  updateUserPermissions,
} from "../controllers/admin-permission.controller";

import { requireSuperAdmin } from "../middlewares/require-super-admin";
import {
  updateAdminStatus,
} from "../controllers/admin-management.controller";

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

router.get(
  "/admins/:id/permissions",
  requireSuperAdmin,
  getUserPermissions,
);

router.put(
  "/admins/:id/permissions",
  requireSuperAdmin,
  updateUserPermissions,
);

router.patch(
  "/admins/:id/status",
  requireSuperAdmin,
  updateAdminStatus,
);

export default router;