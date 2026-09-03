import { Router } from "express";


import {
  getCategories,
  getCategoryBySlug,
  getCategoryProducts,
} from "../controllers/category.controller";

const router = Router();

router.get("/", getCategories);
router.get("/:slug", getCategoryBySlug);
router.get("/:slug/products", getCategoryProducts);

export default router;