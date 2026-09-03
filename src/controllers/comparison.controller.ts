import { Request, Response } from "express";
import prisma from "../db/prisma";
import {
  getComparisonProducts,
  buildSpecificationComparison,
} from "../services/comparison.service";

export const createComparison = async (
  req: Request,
  res: Response,
) => {
  try {
    const { productSlugs } = req.body;

    if (!Array.isArray(productSlugs)) {
      res.status(400).json({
        success: false,
        message: "productSlugs must be an array",
      });
      return;
    }

    if (productSlugs.length < 2 || productSlugs.length > 4) {
      res.status(400).json({
        success: false,
        message: "You can compare between 2 and 4 products",
      });
      return;
    }

    const uniqueSlugs = [...new Set(productSlugs)];

    if (uniqueSlugs.length !== productSlugs.length) {
      res.status(400).json({
        success: false,
        message: "Duplicate products are not allowed",
      });
      return;
    }

    const products = await prisma.product.findMany({
      where: {
        slug: {
          in: uniqueSlugs,
        },
        isActive: true,
      },
      include: {
        brand: true,
        category: true,
        images: {
          orderBy: {
            sortOrder: "asc",
          },
          take: 1,
        },
        specifications: {
          include: {
            specification: true,
            value: true,
          },
        },
        prices: {
          where: {
            inStock: true,
          },
          include: {
            seller: true,
          },
          orderBy: {
            amount: "asc",
          },
        },
      },
    });

    if (products.length !== uniqueSlugs.length) {
      res.status(404).json({
        success: false,
        message: "One or more products were not found",
      });
      return;
    }

    const comparison = await prisma.comparison.create({
      data: {
        products: {
          create: products.map((product) => ({
            productId: product.id,
          })),
        },
      },
      include: {
        products: true,
      },
    });

    const comparisonProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      category: product.category,
      images: product.images,
      specifications: product.specifications,
      prices: product.prices,
      lowestPrice: product.prices[0]?.amount ?? null,
    }));

    res.status(201).json({
      success: true,
      data: {
        comparisonId: comparison.id,
        products: comparisonProducts,
      },
    });
  } catch (error) {
    console.error("Failed to create comparison:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create comparison",
    });
  }
};

export const getComparisonById = async (
  req: Request,
  res: Response,
) => {
  try {
    const comparisonId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!comparisonId) {
      res.status(400).json({
        success: false,
        message: "Comparison ID is required",
      });
      return;
    }

    const comparison = await prisma.comparison.findUnique({
      where: {
        id: comparisonId,
      },
      include: {
        products: true,
      },
    });

    if (!comparison) {
      res.status(404).json({
        success: false,
        message: "Comparison not found",
      });
      return;
    }

    const productIds = comparison.products.map(
      (item) => item.productId,
    );

    const products = await getComparisonProducts(productIds);
    const specifications = buildSpecificationComparison(products);

    res.status(200).json({
  success: true,
  data: {
    comparisonId: comparison.id,
    products,
    specifications,
    createdAt: comparison.createdAt,
    updatedAt: comparison.updatedAt,
  },
});
  } catch (error) {
    console.error("Failed to fetch comparison:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch comparison",
    });
  }
};;