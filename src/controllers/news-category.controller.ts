import { Request, Response } from "express";

import {
  createNewsCategory,
  deleteNewsCategory,
  getAllNewsCategories,
  getNewsCategoryById,
  updateNewsCategory,
} from "../services/news-category.service";

const getParam = (
  value: string | string[] | undefined,
): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

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
    const id =
      typeof req.params.id === "string"
        ? req.params.id
        : Array.isArray(req.params.id)
          ? req.params.id[0]
          : undefined;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required.",
      });
    }

    const category = await getNewsCategoryById(id);

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
    const { name, description, parentId } = req.body;

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

    if (
      parentId !== undefined &&
      parentId !== null &&
      typeof parentId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid parent category.",
      });
    }

    const category = await createNewsCategory(
      name,
      description,
      parentId || null
    );

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
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

    if (error?.code === "P2025") {
      return res.status(400).json({
        success: false,
        message: "Parent category not found.",
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

    const id =
      typeof req.params.id === "string"
        ? req.params.id
        : Array.isArray(req.params.id)
          ? req.params.id[0]
          : undefined;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required.",
      });
    }

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

    const existing = await getNewsCategoryById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const category = await updateNewsCategory(
      id,
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
        message: "A category with this name already exists.",
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
    const id =
      typeof req.params.id === "string"
        ? req.params.id
        : Array.isArray(req.params.id)
          ? req.params.id[0]
          : undefined;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required.",
      });
    }

    const existing = await getNewsCategoryById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    await deleteNewsCategory(id);

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