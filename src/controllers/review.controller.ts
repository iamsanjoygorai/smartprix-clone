import { Request, Response } from "express";

import {
  createReview as createReviewService,
  getProductReviews as getProductReviewsService,
  updateReview as updateReviewService,
  deleteReview as deleteReviewService,
} from "../services/review.service";

export const createReview = async (
  req: Request,
  res: Response,
) => {
  try {
    const { productId, rating, title, content } =
      req.body;

    const userId = req.user.userId;

    if (!productId) {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }

    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5",
      });
      return;
    }

    const review = await createReviewService({
      productId,
      userId,
      rating,
      title,
      content,
    });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error("Create review failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create review";

    const status =
      message === "Product not found"
        ? 404
        : message ===
            "You have already reviewed this product"
          ? 409
          : 400;

    res.status(status).json({
      success: false,
      message,
    });
  }
};

export const getProductReviews = async (
  req: Request,
  res: Response,
) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }

    const reviews =
      await getProductReviewsService(productId);

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error(
      "Get product reviews failed:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch product reviews",
    });
  }
};

export const updateReview = async (
  req: Request,
  res: Response,
) => {
  try {
    const { reviewId } = req.params;

    const { rating, title, content } = req.body;

    const userId = req.user.userId;

    if (!reviewId) {
      res.status(400).json({
        success: false,
        message: "Review ID is required",
      });
      return;
    }

    if (
      rating !== undefined &&
      (
        typeof rating !== "number" ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5",
      });
      return;
    }

    const review = await updateReviewService(
      reviewId,
      userId,
      {
        rating,
        title,
        content,
      },
    );

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error("Update review failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update review";

    const status =
      message === "Review not found"
        ? 404
        : message ===
            "You can only edit your own review"
          ? 403
          : 400;

    res.status(status).json({
      success: false,
      message,
    });
  }
};

export const deleteReview = async (
  req: Request,
  res: Response,
) => {
  try {
    const { reviewId } = req.params;

    const userId = req.user.userId;

    if (!reviewId) {
      res.status(400).json({
        success: false,
        message: "Review ID is required",
      });
      return;
    }

    await deleteReviewService(
      reviewId,
      userId,
    );

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete review";

    const status =
      message === "Review not found"
        ? 404
        : message ===
            "You can only delete your own review"
          ? 403
          : 400;

    res.status(status).json({
      success: false,
      message,
    });
  }
};