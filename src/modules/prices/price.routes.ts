import { Router } from "express";

import {
  getPrices,
  getPriceHistory,
  getBestPriceController,
  getPriceStatisticsController,
} from "./price.controller";

const router = Router();

router.get(
  "/:slug/prices",
  getPrices,
);

router.get(
  "/:slug/price-history",
  getPriceHistory,
);

router.get(
  "/:slug/best-price",
  getBestPriceController,
);

router.get(
  "/:slug/price-statistics",
  getPriceStatisticsController,
);

export default router;