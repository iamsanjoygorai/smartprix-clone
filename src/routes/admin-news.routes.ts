import { Router } from "express";

import {
  createNewsPost,
  deleteNewsPost,
  deleteNewsBulkPost,
  getAdminNews,
  getAdminNewsById,
  updateNewsPost,
} from "../controllers/news.controller";

import {
  getAdminUsers,
  getAdminUser,
  updateAdminUser,
  updateAdminUserStatus,
  deleteAdminUser,
} from "../controllers/user.controller";

import { requirePermission } from "../middlewares/require-permission";
import { PERMISSIONS } from "../config/permissions";

const router = Router();

// =========================================================
// USERS
// =========================================================

// View all users
router.get(
  "/users",
  requirePermission(PERMISSIONS.USERS_VIEW),
  getAdminUsers,
);

// View single user
router.get(
  "/users/:id",
  requirePermission(PERMISSIONS.USERS_VIEW),
  getAdminUser,
);

// Update user
router.put(
  "/users/:id",
  requirePermission(PERMISSIONS.USERS_UPDATE),
  updateAdminUser,
);

// Enable / disable user
router.patch(
  "/users/:id/status",
  requirePermission(PERMISSIONS.USERS_DISABLE),
  updateAdminUserStatus,
);

// Delete user
router.delete(
  "/users/:id",
  requirePermission(PERMISSIONS.USERS_DELETE),
  deleteAdminUser,
);

// =========================================================
// NEWS
// =========================================================

// View all news
router.get(
  "/news",
  requirePermission(PERMISSIONS.NEWS_VIEW),
  getAdminNews,
);

// Create news
router.post(
  "/news",
  requirePermission(PERMISSIONS.NEWS_CREATE),
  createNewsPost,
);

// Bulk delete news
router.delete(
  "/news/bulk",
  requirePermission(PERMISSIONS.NEWS_DELETE),
  deleteNewsBulkPost,
);

// View single news post
router.get(
  "/news/:id",
  requirePermission(PERMISSIONS.NEWS_VIEW),
  getAdminNewsById,
);

// Update news
router.put(
  "/news/:id",
  requirePermission(PERMISSIONS.NEWS_UPDATE),
  updateNewsPost,
);

// Delete news
router.delete(
  "/news/:id",
  requirePermission(PERMISSIONS.NEWS_DELETE),
  deleteNewsPost,
);

export default router;