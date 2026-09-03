import { Request, Response } from "express";

import { deleteAdminProduct } from "../services/admin-product-delete.service";

export const deleteProduct = async (
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

    await deleteAdminProduct(productId);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete product:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete product";

    if (
      message === "Product not found" ||
      message === "Product is already inactive"
    ) {
      res.status(400).json({
        success: false,
        message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};