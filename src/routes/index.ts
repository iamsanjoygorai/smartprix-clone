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

const router = Router();


router.use("/auth", authRoutes);
router.use("/auth", authPasswordRoutes);

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Smartprix Clone API is running",
  });
});

router.use(
  "/products",
  productRoutes,
);

router.use(
  "/comparisons",
  comparisonRoutes,
);

router.use(
  "/categories",
  categoryRoutes,
);

router.use(
  "/brands",
  brandRoutes,
);

router.use(
  "/sellers",
  sellerRoutes,
);

// Public news
router.use(
  "/news",
  newsRoutes,
);

// Protected admin
router.use(
  "/admin",
  requireAuth,
  requireAdmin,
  adminProductRoutes,
);

// IMPORTANT:
// More specific News category route must come
// before the generic /admin News route.
router.use(
  "/admin/news/categories",
  requireAuth,
  requireAdmin,
  adminNewsCategoryRoutes,
);

router.use(
  "/admin/media",
  requireAuth,
  requireAdmin,
  adminMediaRoutes,
);

// Admin Dashboard
router.use(
  "/admin/dashboard",
  requireAuth,
  requireAdmin,
  adminDashboardRoutes,
);

router.use(
  "/admin",
  requireAuth,
  requireAdmin,
  adminAccountRoutes,
);

// Admin News
router.use(
  "/admin",
  requireAuth,
  requireAdmin,
  adminNewsRoutes,
);

router.use(
  "/auth",
  authRoutes,
);




router.use("/news", newsRoutes);

export default router;