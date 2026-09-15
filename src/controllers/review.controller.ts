import { Request, Response } from "express";

import {
  createReview as createReviewService,
  getProductReviews as getProductReviewsService,
  updateReview as updateReviewService,
  deleteReview as deleteReviewService,
} from "../services/review.service";

/* =========================================================
   PARAM HELPER
========================================================= */

const getParam = (
  value: string | string[] | undefined,
): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

/* =========================================================
   USER ID HELPER
========================================================= */

const getUserId = (
  req: Request,
): string | undefined => {
  if (
    typeof req.user === "object" &&
    req.user !== null &&
    "userId" in req.user
  ) {
    const userId = req.user.userId;

    if (typeof userId === "string") {
      return userId;
    }
  }

  return undefined;
};

/* =========================================================
   CREATE REVIEW
========================================================= */

export const createReview = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      productId,
      rating,
      title,
      content,
    } = req.body;

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rating must be an integer between 1 and 5",
      });
    }

    const review = await createReviewService({
      productId,
      userId,
      rating,
      title,
      content,
    });

    return res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error(
      "Create review failed:",
      error,
    );

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

    return res.status(status).json({
      success: false,
      message,
    });
  }
};

/* =========================================================
   GET PRODUCT REVIEWS
========================================================= */

export const getProductReviews = async (
  req: Request,
  res: Response,
) => {
  try {
    const productId = getParam(
      req.params.productId,
    );

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const reviews =
      await getProductReviewsService(productId);

    return res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error(
      "Get product reviews failed:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product reviews",
    });
  }
};

/* =========================================================
   UPDATE REVIEW
========================================================= */

export const updateReview = async (
  req: Request,
  res: Response,
) => {
  try {
    const reviewId = getParam(
      req.params.reviewId,
    );

    const {
      rating,
      title,
      content,
    } = req.body;

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: "Review ID is required",
      });
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
      return res.status(400).json({
        success: false,
        message:
          "Rating must be an integer between 1 and 5",
      });
    }

    const review =
      await updateReviewService(
        reviewId,
        userId,
        {
          rating,
          title,
          content,
        },
      );

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error(
      "Update review failed:",
      error,
    );

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

    return res.status(status).json({
      success: false,
      message,
    });
  }
};

/* =========================================================
   DELETE REVIEW
========================================================= */

export const deleteReview = async (
  req: Request,
  res: Response,
) => {
  try {
    const reviewId = getParam(
      req.params.reviewId,
    );

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: "Review ID is required",
      });
    }

    await deleteReviewService(
      reviewId,
      userId,
    );

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete review failed:",
      error,
    );

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

    return res.status(status).json({
      success: false,
      message,
    });
  }
};