import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";

import {
  createPriceAlertController,
  getPriceAlertsController,
  getPriceAlertController,
  updatePriceAlertController,
  deletePriceAlertController,
} from "./price-alert.controller";

const router = Router();

/* =========================================================
   PRICE ALERT ROUTES
========================================================= */

router.post(
  "/",
  requireAuth,
  createPriceAlertController,
);

router.get(
  "/",
  requireAuth,
  getPriceAlertsController,
);

router.get(
  "/:id",
  requireAuth,
  getPriceAlertController,
);

router.patch(
  "/:id",
  requireAuth,
  updatePriceAlertController,
);

router.delete(
  "/:id",
  requireAuth,
  deletePriceAlertController,
);

export default router;