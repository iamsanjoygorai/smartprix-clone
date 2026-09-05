import { Router } from "express";

import {
  createCategory,
  deleteCategory,
  getNewsCategories,
  getNewsCategory,
  updateCategory,
} from "../controllers/news-category.controller";

const router = Router();

router.get("/", getNewsCategories);

router.post("/", createCategory);

router.get("/:id", getNewsCategory);

router.put("/:id", updateCategory);

router.delete("/:id", deleteCategory);

export default router;