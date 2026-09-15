import { Router } from "express";

import {
  getAnalyticsOverviewController,
  getAnalyticsUsersController,
  getAnalyticsUserGrowthController,
  getAnalyticsProductsController,
  getAnalyticsProductGrowthController,
  getAnalyticsTopProductsController,
  getAnalyticsSearchesController,
  getAnalyticsEngagementController,
  getAnalyticsActivityController,
} from "./analytics.controller";

const router = Router();

router.get(
  "/overview",
  getAnalyticsOverviewController,
);

router.get(
  "/users",
  getAnalyticsUsersController,
);

router.get(
  "/users/growth",
  getAnalyticsUserGrowthController,
);

router.get(
  "/products",
  getAnalyticsProductsController,
);

router.get(
  "/products/growth",
  getAnalyticsProductGrowthController,
);

router.get(
  "/products/top",
  getAnalyticsTopProductsController,
);

router.get(
  "/searches",
  getAnalyticsSearchesController,
);

router.get(
  "/engagement",
  getAnalyticsEngagementController,
);

router.get(
  "/activity",
  getAnalyticsActivityController,
);

export default router;