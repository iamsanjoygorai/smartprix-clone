import { Request, Response } from "express";

import prisma from "../db/prisma";

export const getCategories = async (
  _req: Request,
  res: Response,
) => {
  try {
    const categories = await prisma.category.findMany({
      where: {},
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

export const getCategoryBySlug = async (
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
        message: "Category slug is required",
      });
      return;
    }

    const category = await prisma.category.findUnique({
      where: {
        slug,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Failed to fetch category:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
    });
  }
};