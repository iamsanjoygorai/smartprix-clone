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
import reviewRoutes from "./review.routes";
import adminCategoryRoutes from "./admin-category.routes";
import adminBrandRoutes from "./admin-brand.routes";
import adminSpecificationRoutes from "./admin-specification.routes";
import searchRoutes from "./search.routes";
import userRoutes from "./user.routes";
import favoriteRoutes from "./favorite.routes";
import { getMyProfileHistory } from "../controllers/profile-history.controller";




const router = Router();

// ==============================
// Authentication
// ==============================

router.use("/auth", authRoutes);

router.use("/auth", authPasswordRoutes);


// ==============================
// Profile
// ==============================

router.get(
  "/profile/history",
  requireAuth,
  getMyProfileHistory,
);

// ==============================
// User Account
// ==============================

router.use("/user", userRoutes);

router.use("/favorites", favoriteRoutes);


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
// Public Search Suggestions
// ==============================

router.use("/search", searchRoutes);

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


// ==============================
// Public Reviews
// ==============================

router.use("/reviews", reviewRoutes);

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
  "/admin/brands",
  requireAuth,
  adminBrandRoutes,
);


// ==================================================
// ADMIN PRODUCT SPECIFICATIONS
// ==================================================

router.use(
  "/admin/specifications",
  requireAuth,
  adminSpecificationRoutes,
);

// ==================================================
// ADMIN PRODUCT CATEGORIES
// ==================================================

router.use(
  "/admin/categories",
  requireAuth,
  adminCategoryRoutes,
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