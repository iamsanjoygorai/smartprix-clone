import { Request, Response } from "express";

import { createProductSchema } from "../validators/product.validator";
import { createAdminProduct } from "../services/admin-product.service";

export const createProduct = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = createProductSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid product data",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const product = await createAdminProduct(result.data);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Failed to create product:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create product";

    if (
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
      message: "Failed to create product",
    });
  }
};