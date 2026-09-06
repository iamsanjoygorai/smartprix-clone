import { Router } from "express";

import productRoutes from "./product.routes";
import comparisonRoutes from "./comparison.routes";
import categoryRoutes from "./category.routes";
import brandRoutes from "./brand.routes";
import adminProductRoutes from "./admin-product.routes";
import adminNewsRoutes from "./admin-news.routes";
import newsRoutes from "./news.routes";
import authRoutes from "./auth.routes";
import sellerRoutes from "./seller.routes";

import { requireAuth } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";

import adminNewsCategoryRoutes from "./admin-news-category.routes";
import adminMediaRoutes from "./admin-media.routes";
import adminDashboardRoutes from "./admin-dashboard.routes";
import adminAccountRoutes from "./admin-account.routes";

import authPasswordRoutes from "./auth-password.routes";

import { requirePermission } from "../middlewares/require-permission";
import { PERMISSIONS } from "../config/permissions";
import adminManagementRoutes from "./admin-management.routes";
import adminUserRoutes from "./admin-user.routes";
import adminSettingsRoutes from "./admin-settings.routes";
import adminAuditRoutes from "./admin-audit.routes";

const router = Router();

// ==============================
// Authentication
// ==============================

router.use("/auth", authRoutes);

router.use("/auth", authPasswordRoutes);

// ==============================
// Health
// ==============================

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Smartprix Clone API is running",
  });
});

// ==============================
// Public Products
// ==============================

router.use("/products", productRoutes);

// ==============================
// Public Comparisons
// ==============================

router.use("/comparisons", comparisonRoutes);

// ==============================
// Public Categories
// ==============================

router.use("/categories", categoryRoutes);

// ==============================
// Public Brands
// ==============================

router.use("/brands", brandRoutes);

// ==============================
// Public Sellers
// ==============================

router.use("/sellers", sellerRoutes);

// ==============================
// Public News
// ==============================

router.use("/news", newsRoutes);

// ==================================================
// ADMIN PRODUCTS
// ==================================================
//
// Authentication is handled here.
// Individual product permissions are handled
// inside admin-product.routes.ts.
//
// /admin/products
// /admin/products/:id
// /admin/products/upload-images
//

router.use(
  "/admin",
  requireAuth,
  adminUserRoutes,
);


router.use(
  "/admin",
  requireAuth,
  adminProductRoutes,
);


router.use(
  "/admin",
  requireAuth,
  adminManagementRoutes,
);

// ==================================================
// ADMIN NEWS CATEGORIES
// ==================================================

router.use(
  "/admin/news/categories",
  requireAuth,
  adminNewsCategoryRoutes,
);

// ==================================================
// ADMIN MEDIA
// ==================================================

router.use(
  "/admin/media",
  requireAuth,
  adminMediaRoutes,
);

// ==================================================
// ADMIN DASHBOARD
// ==================================================
//
// Requires:
// dashboard.view
//

router.use(
  "/admin/dashboard",
  requireAuth,
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  adminDashboardRoutes,
);

// ==================================================
// ADMIN ACCOUNT MANAGEMENT
// ==================================================
//
// Will be converted to RBAC in Step 11.
//
// Currently protected by requireAdmin.
//

router.use(
  "/admin",
  requireAuth,
  adminAccountRoutes,
);

// ==================================================
// ADMIN NEWS
// ==================================================
//
// Will be converted to RBAC after Step 11.
//

router.use(
  "/admin",
  requireAuth,
  adminNewsRoutes,
);


router.use(
  "/admin",
  requireAuth,
  adminSettingsRoutes,
);

// Admin Audit Logs
router.use(
  "/admin",
  requireAuth,
  adminAuditRoutes,
);

export default router;