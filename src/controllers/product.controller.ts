import { Request, Response } from "express";

import prisma from "../db/prisma";

import {
  getProductBySlug as getProductDetails,
  getProductPrices as getPrices,
  getProductPriceHistory as getPriceHistory,
} from "../services/product.service";

import { searchProducts } from "../services/product-search.service";

export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined;

    const brand =
      typeof req.query.brand === "string"
        ? req.query.brand.trim()
        : undefined;

    const category =
      typeof req.query.category === "string"
        ? req.query.category.trim()
        : undefined;

    const minPrice =
      req.query.minPrice !== undefined
        ? Number(req.query.minPrice)
        : undefined;

    const maxPrice =
      req.query.maxPrice !== undefined
        ? Number(req.query.maxPrice)
        : undefined;

    const sort =
      typeof req.query.sort === "string"
        ? req.query.sort
        : "newest";

        const specifications: Record<string, string> = {};

const specificationKeys = [
  "display",
  "ram",
  "storage",
  "processor",
  "battery",
  "camera",
];

for (const key of specificationKeys) {
  if (typeof req.query[key] === "string") {
    specifications[key] = req.query[key].trim();
  }
}

    const allowedSorts = [
  "newest",
  "price_asc",
  "price_desc",
  "rating",
];

if (!allowedSorts.includes(sort)) {
  res.status(400).json({
    success: false,
    message: `Invalid sort option. Allowed values: ${allowedSorts.join(", ")}`,
  });
  return;
}

    const result = await searchProducts({
  page,
  limit,
  search,
  brand,
  category,
  minPrice:
    minPrice !== undefined && !Number.isNaN(minPrice)
      ? minPrice
      : undefined,
  maxPrice:
    maxPrice !== undefined && !Number.isNaN(maxPrice)
      ? maxPrice
      : undefined,
    sort,
  specifications,
});

const { products, pagination } = result;
const formattedProducts = products.map((product) => ({
  id: product.id, 
  name: product.name,
  slug: product.slug,
  brand: product.brand,
  category: product.category,
  image: product.images[0] ?? null,
  lowestPrice: product.prices[0]?.amount ?? null,
  currency: product.prices[0]?.currency ?? "INR",
  seller: product.prices[0]?.seller ?? null,
}));

    res.status(200).json({
      success: true,
      data: formattedProducts,
      pagination,
    });
  } catch (error) { 
    console.error("Failed to fetch products:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

export const getProductBySlug = async (
  req: Request,
  res: Response,
) => {
  try {
    const slug = Array.isArray(req.params.slug)
      ? req.params.slug[0]
      : req.params.slug;

    if (!slug) {
      res.status(400).json({
        success: false,
        message: "Product slug is required",
      });
      return;
    }

   const product = await prisma.product.findUnique({
  where: {
    slug,
  },
  include: {
        brand: true,
        category: true,
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        variants: true,
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
          orderBy: {
            amount: "asc",
          },
        },
        reviews: {
          where: {
            isPublished: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!product || !product.isActive) {
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
    console.error("Failed to fetch product:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};


export const getProductPrices = async (
  req: Request,
  res: Response,
) => {
  try {
    const slug = Array.isArray(req.params.slug)
      ? req.params.slug[0]
      : req.params.slug;

    if (!slug) {
      res.status(400).json({
        success: false,
        message: "Product slug is required",
      });
      return;
    }

    const result = await getPrices(slug);

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Failed to fetch product prices:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product prices",
    });
  }
};

export const getProductPriceHistory = async (
  req: Request,
  res: Response,
) => {
  try {
    const slug = Array.isArray(req.params.slug)
      ? req.params.slug[0]
      : req.params.slug;

    if (!slug) {
      res.status(400).json({
        success: false,
        message: "Product slug is required",
      });
      return;
    }

    const result = await getPriceHistory(slug);

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Failed to fetch product price history:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product price history",
    });
  }
};

export const getProductSpecifications = async (
  req: Request,
  res: Response,
) => {
  try {
    const slug = Array.isArray(req.params.slug)
      ? req.params.slug[0]
      : req.params.slug;

    if (!slug) {
      res.status(400).json({
        success: false,
        message: "Product slug is required",
      });
      return;
    }

    const product = await prisma.product.findUnique({
      where: {
        slug,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        specifications: {
          include: {
            specification: true,
            value: true,
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
    console.error("Failed to fetch product specifications:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product specifications",
    });
  }
};