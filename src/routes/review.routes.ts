import { Router } from "express";

import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
} from "../controllers/review.controller";

import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();


router.get("/test", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Review router is working",
  });
});

// Create a review
router.post("/", requireAuth, createReview);

// Get published reviews for a product
router.get("/product/:productId", getProductReviews);

// Update own review
router.patch("/:reviewId", requireAuth, updateReview);

// Delete own review
router.delete("/:reviewId", requireAuth, deleteReview);


export default router;