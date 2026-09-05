import { Request, Response } from "express";

import {
  createNewsCategory,
  deleteNewsCategory,
  getAllNewsCategories,
  getNewsCategoryById,
  updateNewsCategory,
} from "../services/news-category.service";

export async function getNewsCategories(
  _req: Request,
  res: Response
) {
  try {
    const categories =
      await getAllNewsCategories();

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch news categories.",
    });
  }
}

export async function getNewsCategory(
  req: Request,
  res: Response
) {
  try {
    const category =
      await getNewsCategoryById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch category.",
    });
  }
}

export async function createCategory(
  req: Request,
  res: Response
) {
  try {
    const { name, description } = req.body;

    if (
      !name ||
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    const category =
      await createNewsCategory(
        name,
        description
      );

    return res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    console.error(error);

    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message:
          "A category with this name already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create category.",
    });
  }
}

export async function updateCategory(
  req: Request,
  res: Response
) {
  try {
    const { name, description } = req.body;

    if (
      !name ||
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    const existing =
      await getNewsCategoryById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const category =
      await updateNewsCategory(
        req.params.id,
        name,
        description
      );

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    console.error(error);

    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message:
          "A category with this name already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update category.",
    });
  }
}

export async function deleteCategory(
  req: Request,
  res: Response
) {
  try {
    const existing =
      await getNewsCategoryById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    await deleteNewsCategory(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete category.",
    });
  }
}