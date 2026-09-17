import { Request, Response } from "express";

import {
  getProductSpecifications,
  updateProductSpecifications,
} from "./product-specification.service";

/* =========================================================
   GET PRODUCT SPECIFICATIONS
   GET /admin/products/:id/specifications
========================================================= */

export const getProductSpecificationsController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const productId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!productId) {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }

    const result = await getProductSpecifications(productId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Failed to fetch product specifications:",
      error,
    );

    const message =
      error instanceof Error ? error.message : "Unknown error";

    if (
      message === "Product not found" ||
      message ===
        "No active specification schema found for product category"
    ) {
      res.status(400).json({
        success: false,
        message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch product specifications",
    });
  }
};

/* =========================================================
   UPDATE PRODUCT SPECIFICATIONS
   PUT /admin/products/:id/specifications
========================================================= */

export const updateProductSpecificationsController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const productId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!productId) {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }

    const result = await updateProductSpecifications(
      productId,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Product specifications updated successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Failed to update product specifications:",
      error,
    );

    const message =
      error instanceof Error ? error.message : "Unknown error";

    const clientErrors = [
      "Product not found",
      "Invalid product specification data",
      "No active specification schema found for product category",
    ];

    const isDefinitionError =
      message.startsWith(
        "Specification definition not found in active schema:",
      ) ||
      message.startsWith(
        "Duplicate specification definition:",
      ) ||
      message.startsWith("Required specification") ||
      message.startsWith("Invalid option ");

    if (clientErrors.includes(message) || isDefinitionError) {
      res.status(400).json({
        success: false,
        message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to update product specifications",
    });
  }
};