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

import {
  requireAuth,
} from "../middlewares/auth.middleware";

import {
  requireAdmin,
} from "../middlewares/admin.middleware";

const router = Router();

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

export default router;