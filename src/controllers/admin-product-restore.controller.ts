import { Request, Response } from "express";

import { restoreAdminProduct } from "../services/admin-product-restore.service";

export const restoreProduct = async (
  req: Request,
  res: Response,
) => {
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

    await restoreAdminProduct(productId);

    res.status(200).json({
      success: true,
      message: "Product restored successfully",
    });
  } catch (error) {
    console.error("Failed to restore product:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to restore product";

    if (
      message === "Product not found" ||
      message === "Product is already active"
    ) {
      res.status(400).json({
        success: false,
        message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to restore product",
    });
  }
};