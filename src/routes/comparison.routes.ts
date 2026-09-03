import { Router } from "express";

import {
  createComparison,
  getComparisonById,
} from "../controllers/comparison.controller";

const router = Router();

router.post("/", createComparison);

router.get("/:id", getComparisonById);

export default router;