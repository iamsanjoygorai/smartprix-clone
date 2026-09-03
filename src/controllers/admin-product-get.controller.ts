import { Request, Response } from "express";

import prisma from "../db/prisma";

export const getAdminProduct = async (
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

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        brand: true,
        category: true,
        images: true,
        specifications: {
          include: {
            specification: true,
            value: true,
          },
        },
        prices: {
          include: {
            seller: true,
          },
        },
      },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Failed to fetch admin product:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};