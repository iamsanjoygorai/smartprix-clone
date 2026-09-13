import { Router } from "express";

import {
  getAuditLogs,
  getUserAuditHistory,
  getUserSessions,
  getAllSessions,
  getUserSearchHistory,
} from "./audit.controller";

import { requireSuperAdmin } from "../../middlewares/require-super-admin";

const router = Router();

/* =========================================================
   SUPER ADMIN AUDIT HISTORY
========================================================= */

/**
 * GET /api/admin/audit
 *
 * All audit logs with filters and pagination.
 */
router.get(
  "/",
  requireSuperAdmin,
  getAuditLogs,
);


/**
 * GET /api/admin/audit/sessions
 *
 * All user sessions.
 * SUPER ADMIN ONLY.
 */
router.get(
  "/sessions",
  requireSuperAdmin,
  getAllSessions,
);

/**
 * GET /api/admin/audit/sessions/:userId
 *
 * User session history.
 */
router.get(
  "/sessions/:userId",
  requireSuperAdmin,
  getUserSessions,
);

/**
 * GET /api/admin/audit/search/:userId
 *
 * User search history.
 */
router.get(
  "/search/:userId",
  requireSuperAdmin,
  getUserSearchHistory,
);

/**
 * GET /api/admin/audit/:userId
 *
 * Complete audit history for a user.
 */
router.get(
  "/:userId",
  requireSuperAdmin,
  getUserAuditHistory,
);

export default router;