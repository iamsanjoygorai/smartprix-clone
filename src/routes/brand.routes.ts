import { Router } from "express";

import {
  getBrands,
  getBrandBySlug,
  getBrandProducts,
} from "../controllers/brand.controller";

const router = Router();

router.get("/", getBrands);
router.get("/:slug/products", getBrandProducts);
router.get("/:slug", getBrandBySlug);

export default router;