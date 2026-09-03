import { Request, Response } from "express";

import prisma from "../db/prisma";

export const getBrands = async (
  _req: Request,
  res: Response,
) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    console.error("Failed to fetch brands:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch brands",
    });
  }
};

export const getBrandBySlug = async (
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
        message: "Brand slug is required",
      });
      return;
    }

    const brand = await prisma.brand.findUnique({
      where: {
        slug,
      },
    });

    if (!brand) {
      res.status(404).json({
        success: false,
        message: "Brand not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    console.error("Failed to fetch brand:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch brand",
    });
  }
};


export const getBrandProducts = async (
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
        message: "Brand slug is required",
      });
      return;
    }

    const brand = await prisma.brand.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!brand) {
      res.status(404).json({
        success: false,
        message: "Brand not found",
      });
      return;
    }

    const products = await prisma.product.findMany({
      where: {
        brandId: brand.id,
        isActive: true,
      },
      include: {
        category: true,
        images: {
          orderBy: {
            sortOrder: "asc",
          },
          take: 1,
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
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: {
        brand,
        products,
      },
    });
  } catch (error) {
    console.error("Failed to fetch brand products:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch brand products",
    });
  }
};