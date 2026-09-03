import { Router } from "express";

import {
  getProducts,
  getProductBySlug,
  getProductPrices,
  getProductPriceHistory,
  getProductSpecifications
} from "../controllers/product.controller";



const router = Router();

router.get("/", getProducts);

router.get("/:slug/prices", getProductPrices);

router.get("/:slug/price-history", getProductPriceHistory);

router.get("/:slug/specifications", getProductSpecifications);

router.get("/:slug", getProductBySlug);

export default router;