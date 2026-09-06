import { Router } from "express";

import {
  createNewsPost,
  deleteNewsPost,
  deleteNewsBulkPost,
  getAdminNews,
  getAdminNewsById,
  updateNewsPost,
} from "../controllers/news.controller";

import { requirePermission } from "../middlewares/require-permission";
import { PERMISSIONS } from "../config/permissions";

const router = Router();

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