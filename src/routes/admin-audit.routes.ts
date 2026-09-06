import { Router } from "express";

import {
  getAuditLogs,
} from "../controllers/admin-audit.controller";

import { requirePermission } from "../middlewares/require-permission";
import { PERMISSIONS } from "../config/permissions";

const router = Router();

router.get(
  "/audit-logs",
  requirePermission(PERMISSIONS.AUDIT_VIEW),
  getAuditLogs,
);

export default router;