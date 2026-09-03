import { Router } from "express";

import {
  getBrands,
  getBrandBySlug,
} from "../controllers/brand.controller";

const router = Router();

router.get("/", getBrands);
router.get("/:slug", getBrandBySlug);

export default router;