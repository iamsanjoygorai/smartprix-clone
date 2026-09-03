import { Request, Response } from "express";

import prisma from "../db/prisma";

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

    const where = {
      isActive: true,

      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                description: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),

      ...(brand
        ? {
            brand: {
              slug: brand,
            },
          }
        : {}),

      ...(category
        ? {
            category: {
              slug: category,
            },
          }
        : {}),

      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            prices: {
              some: {
                inStock: true,
                amount: {
                  ...(minPrice !== undefined && !Number.isNaN(minPrice)
                    ? { gte: minPrice }
                    : {}),
                  ...(maxPrice !== undefined && !Number.isNaN(maxPrice)
                    ? { lte: maxPrice }
                    : {}),
                },
              },
            },
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          brand: true,
          category: true,
          images: {
            orderBy: {
              sortOrder: "asc",
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.product.count({
        where,
      }),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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