import { Router } from "express";

import {
  getSettings,
  updateSettings,
} from "../controllers/admin-settings.controller";

import { requirePermission } from "../middlewares/require-permission";
import { PERMISSIONS } from "../config/permissions";

const router = Router();

router.get(
  "/settings",
  requirePermission(PERMISSIONS.SETTINGS_VIEW),
  getSettings,
);

router.patch(
  "/settings",
  requirePermission(PERMISSIONS.SETTINGS_UPDATE),
  updateSettings,
);

export default router;