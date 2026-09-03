import { Router } from "express";

import {
  getAllProducts,
  getProduct,
  getPrices,
  getPriceHistory,
  getSpecifications,
} from "../controllers/product.controller";

const router = Router();

router.get("/", getAllProducts);
router.get("/:slug", getProduct);
router.get("/:slug/prices", getPrices);
router.get("/:slug/price-history", getPriceHistory);
router.get("/:slug/specifications", getSpecifications);

export default router;
