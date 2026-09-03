import { Request, Response } from "express";

import { getAdminProducts } from "../services/admin-product-list.service";

export const getAllAdminProducts = async (
  _req: Request,
  res: Response,
) => {
  try {
    const products = await getAdminProducts();

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Failed to fetch admin products:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch admin products",
    });
  }
};