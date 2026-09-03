import { Request, Response } from "express";

import { updateProductSchema } from "../validators/admin-product-update.validator";
import { updateAdminProduct } from "../services/admin-product-update.service";

export const updateProduct = async (
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

    const result = updateProductSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid product data",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const product = await updateAdminProduct(
      productId,
      result.data,
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Failed to update product:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update product";

    if (
      message === "Product not found" ||
      message === "Brand not found" ||
      message === "Category not found" ||
      message === "Seller not found" ||
      message.startsWith("Specification not found:")
    ) {
      res.status(400).json({
        success: false,
        message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};